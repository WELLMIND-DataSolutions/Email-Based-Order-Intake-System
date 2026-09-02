"""Auth primitives for the single-admin dashboard login (blueprint Point 12).

No user table: one credential pair lives in .env (ADMIN_USERNAME /
ADMIN_PASSWORD_HASH), matching the docx's "single internal team" framing.
Password hashing uses stdlib pbkdf2_hmac rather than adding a bcrypt/passlib
dependency for a single credential pair.
"""

import hashlib
import hmac
import secrets
import sys
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app import config

_PBKDF2_ITERATIONS = 390_000
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hex_digest = stored_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS)
    return hmac.compare_digest(digest.hex(), hex_digest)


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expires_at}, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise credentials_error
    subject = payload.get("sub")
    if subject is None:
        raise credentials_error
    return subject


if __name__ == "__main__":
    # `python -m app.security <password>` - prints an ADMIN_PASSWORD_HASH for .env
    if len(sys.argv) != 2:
        print("Usage: python -m app.security <password>")
        sys.exit(1)
    print(hash_password(sys.argv[1]))

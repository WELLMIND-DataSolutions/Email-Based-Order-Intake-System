"""Transparent field-level encryption for customer PII (blueprint Point 12).

Order.customer_name / customer_email / shipping_address use EncryptedString
so crud.py keeps reading/writing plain Python strings - encryption happens
at the SQLAlchemy boundary, on the way in and out of the database.
"""

from cryptography.fernet import Fernet
from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from app import config

_fernet_instance: Fernet | None = None


def _fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        if not config.FERNET_KEY:
            raise RuntimeError("FERNET_KEY is not set - generate one with Fernet.generate_key()")
        _fernet_instance = Fernet(config.FERNET_KEY)
    return _fernet_instance


class EncryptedString(TypeDecorator):
    """Text column that stores Fernet ciphertext; impl is Text (not the
    declared length) since ciphertext runs longer than the plaintext it
    replaces."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return _fernet().encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return _fernet().decrypt(value.encode()).decode()

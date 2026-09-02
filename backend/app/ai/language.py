"""Roman Urdu detection (Unique Feature 1, step 1).

The blueprint suggests fasttext, but its pretrained lid.176 model only knows
Arabic-script Urdu — Roman Urdu (Latin script) is not among its labels and
gets misdetected as English/Indonesian. A high-signal wordlist works better
for this one binary decision and needs no extra dependency.
"""

import re

# Function words + common commerce phrases that are ubiquitous in Roman Urdu
# but essentially absent from English prose.
_ROMAN_URDU_WORDS = {
    "aap", "abhi", "acha", "achi", "agar", "ap", "apka", "apki", "arha",
    "aur", "bhai", "bhej", "bhejain", "bhejo", "bhi", "chahiye", "chahiyen",
    "dena", "den", "dijiye", "dukaan", "ghar", "hai", "hain", "hamara",
    "hamari", "ho", "hoga", "hogi", "hum", "hume", "humein", "jaldi", "jana",
    "jaye", "ka", "karna", "karo", "kar", "ke", "ki", "kitna", "kitne", "ko",
    "krna", "kya", "liye", "lena", "mein", "mera", "meri", "mujhe", "mujha",
    "nahi", "nahin", "ni", "pe", "raha", "rahi", "saath", "sath", "salam",
    "se", "shukriya", "tha", "thi", "wala", "wali", "walay", "warna", "ya",
    "yeh", "ye", "zaroorat", "zarurat",
}

_WORD_RE = re.compile(r"[a-z']+")

# At least this many hits AND this share of all words → Roman Urdu.
_MIN_HITS = 3
_MIN_RATIO = 0.12


def is_roman_urdu(text: str) -> bool:
    words = _WORD_RE.findall(text.lower())
    if not words:
        return False
    hits = sum(1 for w in words if w in _ROMAN_URDU_WORDS)
    return hits >= _MIN_HITS and hits / len(words) >= _MIN_RATIO

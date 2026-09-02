"""Verified Roman Urdu email → JSON pairs (Unique Feature 1, step 2).

Injected into the extraction prompt as few-shot examples whenever
language.is_roman_urdu() fires. Kept deliberately compact — every token here
is paid for on each CPU inference. Grow this list from real AuditLog
corrections over time.
"""

FEW_SHOT_EXAMPLES: list[tuple[str, str]] = [
    (
        "salam bhai, mujhe 2 shirts chahiye XL size, aur 1 jeans 34 waist. "
        "address: house 12, street 5, model town lahore. shukriya",
        '{"customer_name": null, "customer_email": null, '
        '"order_items": [{"description": "Shirt (XL)", "quantity": 2, "unit_price": null}, '
        '{"description": "Jeans (34 waist)", "quantity": 1, "unit_price": null}], '
        '"total_amount": null, "shipping_address": "House 12, Street 5, Model Town, Lahore"}',
    ),
    (
        "bhai jaldi bhejo 5 kg chawal aur 2 kg daal, ghar ka address wohi purana. ahmed",
        '{"customer_name": "Ahmed", "customer_email": null, '
        '"order_items": [{"description": "Chawal (rice)", "quantity": 5, "unit_price": null}, '
        '{"description": "Daal (lentils)", "quantity": 2, "unit_price": null}], '
        '"total_amount": null, "shipping_address": null}',
    ),
    (
        "assalam o alaikum, humein 10 dozen anday aur 4 litre doodh chahiye "
        "roz ki tarah. bill 2800 ka banta hai na? dukan: bismillah store, saddar karachi",
        '{"customer_name": "Bismillah Store", "customer_email": null, '
        '"order_items": [{"description": "Anday (eggs, dozen)", "quantity": 10, "unit_price": null}, '
        '{"description": "Doodh (milk, litre)", "quantity": 4, "unit_price": null}], '
        '"total_amount": 2800, "shipping_address": "Bismillah Store, Saddar, Karachi"}',
    ),
    (
        "sir 3 mobile covers samsung a54 walay chahiye, 450 wala rate final tha. "
        "bhej den bilal electronics gujranwala. mera number wohi hai",
        '{"customer_name": "Bilal Electronics", "customer_email": null, '
        '"order_items": [{"description": "Mobile cover (Samsung A54)", "quantity": 3, "unit_price": 450}], '
        '"total_amount": null, "shipping_address": "Bilal Electronics, Gujranwala"}',
    ),
    (
        "malik sahab ko bolen 20 bag cement fauji wala bhejain site pe, "
        "dha phase 6 wali site. rate 1250 chal raha hai na per bag? total 25000 hua",
        '{"customer_name": null, "customer_email": null, '
        '"order_items": [{"description": "Cement bag (Fauji)", "quantity": 20, "unit_price": 1250}], '
        '"total_amount": 25000, "shipping_address": "DHA Phase 6 site"}',
    ),
    (
        "aoa, meri bakery ke liye 15 kg maida, 5 kg sugar aur 2 carton butter "
        "chahiye kal subah tak. gulshan bakery, university road peshawar. "
        "email: gulshanbakery@gmail.com",
        '{"customer_name": "Gulshan Bakery", "customer_email": "gulshanbakery@gmail.com", '
        '"order_items": [{"description": "Maida (flour, kg)", "quantity": 15, "unit_price": null}, '
        '{"description": "Sugar (kg)", "quantity": 5, "unit_price": null}, '
        '{"description": "Butter (carton)", "quantity": 2, "unit_price": null}], '
        '"total_amount": null, "shipping_address": "Gulshan Bakery, University Road, Peshawar"}',
    ),
    (
        "bhai wo laal wali chadar 6 piece aur neeli 4 piece kar dena is baar. "
        "pichli dafa wala hisaab hi rakhna, 800 per piece. faisalabad cloth market, shop 44",
        '{"customer_name": null, "customer_email": null, '
        '"order_items": [{"description": "Chadar (red)", "quantity": 6, "unit_price": 800}, '
        '{"description": "Chadar (blue)", "quantity": 4, "unit_price": 800}], '
        '"total_amount": 8000, "shipping_address": "Shop 44, Cloth Market, Faisalabad"}',
    ),
    (
        "salam, office ke liye 2 printer hp 1108 aur 5 ream paper a4 chahiye. "
        "kitna time lagega? deliver karna hai: al-noor traders, blue area islamabad. hamza",
        '{"customer_name": "Hamza (Al-Noor Traders)", "customer_email": null, '
        '"order_items": [{"description": "HP 1108 printer", "quantity": 2, "unit_price": null}, '
        '{"description": "A4 paper ream", "quantity": 5, "unit_price": null}], '
        '"total_amount": null, "shipping_address": "Al-Noor Traders, Blue Area, Islamabad"}',
    ),
]

# AI Email Order Intake — Engine

This is the part that works quietly in the background, turning customer
emails into ready-to-review orders.

## What it does

- **Watches your inbox** and picks up new customer emails automatically —
  no one has to check manually.
- **Figures out what each email actually is** — a real order, a question
  about pricing, a complaint, or spam — so only genuine orders get acted on.
- **Reads the order details out of the email itself**, even messy or
  casually-written ones, including orders written in Roman Urdu
  ("bhai mujhe 2 piece chahiye, size XL...") — something most tools miss
  entirely.
- **Understands attachments too** — a typed invoice, a scanned photo of a
  receipt, whatever the customer sends.
- **Learns from corrections.** Every time a teammate fixes something in the
  review dashboard, that correction feeds back in, so the same mistake is
  less likely to repeat.
- **Adjusts its own confidence over time** — as it gets more accurate, it
  automatically sends fewer orders for human review, without anyone having
  to retune it.
- **Keeps customer information encrypted** — names, emails, and addresses
  are stored securely, not as plain readable text.
- **Sends approved orders onward** to your order management system
  automatically, the moment a teammate approves them.
- **Keeps a full history** of every email received, every decision made,
  and every edit — so there's always a record of who did what.

This is the companion piece to the review dashboard — the dashboard is
the screen your team looks at; this is what feeds it.

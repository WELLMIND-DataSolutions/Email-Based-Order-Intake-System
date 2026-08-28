# Email-Based Order Intake System

<p align="center">
  An automated pipeline that reads incoming customer order emails and converts them into clean, structured, actionable order records — removing manual data entry and reducing order-processing errors.
</p>

<p align="center">
  <b>🚧 Project Status: In Development</b>
</p>

---

## What This Project Does

Businesses that receive orders via email lose time and accuracy to manual entry — orders get missed, mistyped, or delayed when staff have to read and re-key every message by hand.

This system monitors an inbox, parses incoming order emails (structured or free-text), extracts key order details, and outputs clean, structured records ready for downstream use — with low-confidence or ambiguous emails flagged for human review.

**Key capabilities:**

- Connects to an email inbox (IMAP / Gmail API / Outlook API) and monitors for new order emails
- Parses email body and attachments to extract order fields (product, quantity, customer, delivery info, etc.)
- Uses NLP and rule-based extraction to handle varied, unstructured email formats
- Validates extracted data and flags incomplete or low-confidence orders for manual review
- Exports structured orders to CSV / database / order-management system
- Sends automatic acknowledgement or error-notification emails back to the sender

---

## Why This Is Useful

- **Order/Sales teams** get structured order data automatically instead of manually reading every email
- **Operations** reduce data-entry errors and processing delays
- **Businesses** get a foundation that scales to high email volumes without adding headcount

---

## System Workflow

```
Incoming Email → Email Fetcher → Parser / NLP Extraction → Validation
     → Structured Order Output → Auto-Reply / Flag for Review → Order Storage
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/WELLMIND-DataSolutions/Email-Based-Order-Intake-System.git
cd Email-Based-Order-Intake-System
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure email access

```
Add your email credentials / API keys to a .env file in the project root
```

### 4. Run the pipeline

```bash
python main.py
```

---

## Project Structure

```
Email-Based-Order-Intake-System/
├── data/
│   ├── raw/                # Sample/raw email exports for testing
│   └── processed/          # Extracted structured order data
├── src/
│   ├── email_fetcher.py    # Connects to inbox, pulls new emails
│   ├── parser.py           # Extracts order fields from email text
│   ├── validator.py        # Validates and scores extracted data
│   └── notifier.py         # Sends acknowledgement/error emails
├── models/                 # NLP/ML models used for extraction
├── reports/                # Processing summaries and logs
├── main.py
├── requirements.txt
└── README.md
```

---

## Methodology

### Email parsing

Incoming emails are parsed for structured fields (order ID, product name, quantity, customer name, delivery address) using a combination of pattern matching for consistent formats and NLP-based extraction for free-text orders.

### Validation

Extracted orders are checked for completeness and consistency. Orders missing required fields or with low extraction confidence are flagged instead of silently accepted.

### Output

Validated orders are exported to a structured format (CSV / database) and made available for the next step in the order-processing workflow.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Python 3.10+ | Core language |
| IMAP / Gmail API / Outlook API | Email access |
| Pandas | Data wrangling |
| spaCy / regex | Text extraction & NLP |
| SQLite / CSV | Structured order storage |

---

## Roadmap

- [ ] Set up email inbox connection
- [ ] Build baseline email parser (rule-based)
- [ ] Add NLP-based extraction for free-text orders
- [ ] Build validation & confidence scoring
- [ ] Add auto-reply / error notification
- [ ] Export pipeline to CSV / database
- [ ] Test with real/sample email datasets
- [ ] Write documentation and usage guide

---

## Getting Help

- **Issues:** Open a [GitHub Issue](https://github.com/WELLMIND-DataSolutions/Email-Based-Order-Intake-System/issues) to report bugs or ask questions

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

Please open an issue first for major changes so we can discuss the approach.

---

## Author & Maintainer

**WELLMIND Data Solutions**

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Automating order intake, one email at a time.</p>

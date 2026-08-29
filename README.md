# Email Based Order Intake System

<p align="center">
  <img src="https://img.shields.io/badge/Processing%20Method-Email%20Automation-12B886?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Training%20Required-None-4C6EF5?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-In%20Development-F59E0B?style=for-the-badge"/>
</p>

<p align="center">
An intelligent email automation system that receives customer orders through email, extracts order details, validates the information, and creates structured orders automatically.
</p>

---

## Overview

Businesses often receive customer orders through emails containing order information in different formats. Manually reading these emails, identifying customer and product details, and entering them into an order management system is time consuming and can lead to data entry errors.

The **Email Based Order Intake System** automates this complete process. It monitors a designated email inbox, retrieves incoming order emails, extracts important information from the email body and attachments, validates the extracted data, and creates a structured order in the target system or database.

This allows businesses to convert unstructured email orders into organized and actionable order records with minimal manual intervention.

---

## Aim

* Automate the process of receiving and processing orders through email
* Extract customer, product, quantity, pricing, and delivery information automatically
* Reduce manual data entry and human errors
* Validate extracted information before creating an order
* Handle different email formats and attached order documents
* Provide notifications when orders are successfully processed or require manual review
* Maintain processing logs for traceability and auditing

---

## Key Features

* **Email Monitoring** — Continuously monitors a configured inbox for new customer orders
* **Email Retrieval** — Fetches incoming emails and their attachments automatically
* **Order Data Extraction** — Extracts important order information from email content and documents
* **Data Validation** — Checks mandatory fields, formats, quantities, and business rules
* **Automated Order Creation** — Converts validated information into structured order records
* **Error Handling** — Sends invalid or incomplete orders for manual review
* **Notifications** — Provides processing status and confirmation notifications
* **Audit Logging** — Records processed emails, extracted information, errors, and order status

---

## Benefits

* **Reduces Manual Effort** — Eliminates repetitive reading and data entry from order emails
* **Improves Accuracy** — Reduces human mistakes when transferring order information
* **Faster Order Processing** — Processes incoming orders much faster than manual workflows
* **Handles Unstructured Emails** — Can extract information even when customers use different email formats
* **Improves Customer Experience** — Enables faster order confirmation and processing
* **Scalable** — Can process a large number of incoming order emails consistently
* **Cost Effective** — Reduces operational workload and improves employee productivity
* **Better Traceability** — Maintains logs of processed emails and created orders

---

## System Workflow

<p align="center">
  <img src="./Assets/workflow.png" alt="Email Based Order Intake System Workflow" width="100%"/>
</p>

### Workflow Steps

**1. Email Received**
A customer sends an order to the designated business email address.

**2. Email Fetching**
The system connects to the configured mailbox and retrieves new emails and attachments.

**3. Data Extraction**
The system analyzes the email body and attached documents to identify relevant order information such as customer details, products, quantities, prices, and delivery information.

**4. Data Validation**
The extracted information is checked for completeness, correct formats, and required business rules.

**5. Order Validation Decision**

* **Valid Order:** The system proceeds with automated order creation.
* **Invalid Order:** The system records the error and sends the order for manual review.

**6. Order Creation**
Validated order information is converted into a structured order and stored in the target database or order management system.

**7. Stakeholder Notification**
The system sends confirmation or status notifications to the relevant customer or internal team.

**8. Audit Logging**
All important processing events are recorded for monitoring, troubleshooting, and future auditing.

---

## Example Order Information

The system can extract information such as:

| Field            | Example                                             |
| ---------------- | --------------------------------------------------- |
| Customer Name    | ABC Traders                                         |
| Customer Email   | [customer@example.com](mailto:customer@example.com) |
| Product          | Laptop                                              |
| Quantity         | 10                                                  |
| Unit Price       | 85000                                               |
| Delivery Address | Lahore                                              |
| Order Date       | 2026-08-29                                          |
| Payment Terms    | Net 30                                              |

---

## Use Cases

* Businesses receiving customer orders through email
* Wholesale and distribution companies
* Retail businesses with email based ordering
* Suppliers receiving purchase requests
* Organizations processing bulk product orders
* Companies transitioning from manual order entry to automation

---

## Suggested Technology Stack

* **Programming Language:** Python
* **Email Integration:** IMAP or Microsoft Graph API
* **Document Processing:** PDF and document extraction libraries
* **Data Processing:** Pandas
* **AI Extraction:** LLM or Document AI model
* **Database:** SQLite or PostgreSQL
* **Backend:** FastAPI
* **Automation:** Scheduled email polling or event based processing

---

## Project Goal

The primary goal of the **Email Based Order Intake System** is to transform incoming unstructured customer emails into validated, structured, and actionable orders automatically.

> **Email Received → Data Extracted → Data Validated → Order Created → Notification Sent**

---

<p align="center">
  Automating email orders into structured business processes.
</p>

# ShohojHishab - সহজ হিসাব

**Voice-first bookkeeping for local shop owners, powered by Gemma 4.**

ShohojHishab (সহজ হিসাব — “easy accounting”) helps small shop owners record daily sales, customer credit (*baki*), and debt repayments simply by speaking naturally in Bangla.

The system converts spoken orders into structured transaction data, automatically manages customer profiles, updates outstanding debt, and produces an end-of-day business summary.

Built for **Build With Gemma @ Bangladesh — Track 6: Native Audio & Voice**.

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [MVP Features](#mvp-features)
- [System Workflow](#system-workflow)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Demo Flow](#demo-flow)
- [Future Plans](#future-plans)
- [Current Limitations](#current-limitations)

---

## Problem

Most neighborhood shops in Bangladesh still maintain their sales and customer debt records using handwritten notebooks or memory.

This creates several problems:

- Shop owners cannot quickly determine who owes money.
- Paper records can be lost, damaged, or miscalculated.
- Existing POS and accounting tools often require typing and English-language proficiency.
- Many shop owners are not comfortable using complicated digital forms.
- Daily sales, collected payments, and outstanding baki are difficult to summarize.
- Fast-moving shop environments make manual data entry inconvenient.

ShohojHishab is designed around one idea:

> The shopkeeper should not have to change how they already work. The system should listen and understand.

---

## Solution

ShohojHishab is a voice-first bookkeeping application where a shopkeeper can speak an order naturally in Bangla.

Example:

> “কামাল ভাই দুইটা চালের প্যাকেট আর একটা তেল নিল, টাকা পরে দেবে।”

The application:

1. Records the voice input.
2. Converts the audio into Bangla text.
3. Sends the transcript to Gemma 4 E2B.
4. Extracts structured order information.
5. Finds or creates the customer.
6. Calculates the order total.
7. Records cash payment, partial payment, or baki.
8. Updates the customer’s outstanding baki.
9. Creates ledger entries.
10. Includes the transaction in the end-of-day summary.

---

## MVP Features

### Voice Order Capture

The shopkeeper records an order using the browser microphone.

The browser uses the `MediaRecorder` API to capture the audio and send it to the backend.

---

### Bangla Speech-to-Text

A Bangla ASR system converts the recorded audio into a text transcript.

Example:

```text
Audio:
“রহিম তিনটা ড্রিংক পঞ্চাশ টাকা করে বাকিতে নিল”

Transcript:
“রহিম তিনটা ড্রিংক ৫০ টাকা করে বাকিতে নিল”
````

---

### Gemma-Powered Order Parsing

Gemma 4 E2B converts the transcript into structured JSON.

Example:

```json
{
  "customerName": "Rahim",
  "items": [
    {
      "name": "Drink",
      "quantity": 3,
      "unitPrice": 50
    }
  ],
  "paymentType": "BAKI",
  "paidAmount": 0
}
```

---

### Automatic Customer Lookup and Creation

The backend normalizes the customer’s name before searching MongoDB.

If the customer exists:

* The new order is attached using the existing customer ID.
* The customer’s current baki is updated.

If the customer does not exist:

* The system asks for a phone number.
* A new customer profile is created.

---

### Itemized Orders

Each order stores:

* Product name
* Quantity
* Unit price
* Calculated subtotal
* Total amount
* Paid amount
* Baki amount
* Original transcript

---

### Cash, Partial, and Baki Payments

The order system supports:

* Fully paid cash orders
* Fully unpaid baki orders
* Partially paid orders

For a partial order:

```text
Order total: ৳500
Paid now: ৳200
Added to baki: ৳300
```

---

### Running Baki Balance

Each customer document maintains an `outstandingBaki` field.

When a baki order is created:

```text
outstandingBaki += bakiAmount
```

When the customer makes a payment:

```text
outstandingBaki -= paymentAmount
```

The system prevents invalid repayments greater than the current outstanding balance.

---

### Baki Repayment

A customer can repay part or all of their existing debt.

The backend:

1. Validates the payment.
2. Reduces the customer’s outstanding baki.
3. Creates a `BAKI_PAYMENT` ledger entry.
4. Returns the updated balance.

---

### End-of-Day Summary

The backend generates the daily summary on demand.

It includes:

* Total sales
* Total cash collected
* Total baki added today
* Total outstanding baki
* Top five debtors

---

### Text Fallback

If voice recording or transcription fails, the user can type the order manually.

The typed text goes through the same Gemma parsing and database pipeline.

---

## System Workflow

```text
Shopkeeper speaks in Bangla
        │
        ▼
Browser MediaRecorder API
        │
        │ Audio blob
        ▼
Express backend
        │
        ▼
Bangla Speech-to-Text
        │
        │ Bangla transcript
        ▼
Gemma 4 E2B
        │
        │ Structured order JSON
        ▼
Customer lookup or creation
        │
        ▼
Order calculation
        │
        ▼
Cash / partial / baki decision
        │
        ▼
MongoDB
        ├── Customer update
        ├── Order creation
        └── Ledger entry creation
        │
        ▼
Bill confirmation and daily summary
```

---

## Architecture

```text
┌─────────────────────────────────────┐
│             Frontend                │
│                                     │
│ HTML, CSS, JavaScript               │
│ Browser MediaRecorder API           │
└─────────────────┬───────────────────┘
                  │
                  │ Audio or text
                  ▼
┌─────────────────────────────────────┐
│          Node.js Backend            │
│                                     │
│ Express REST API                    │
│ Request validation                  │
│ Business logic                      │
└───────────┬─────────────────────────┘
            │
            ├──────────────► Bangla ASR
            │                    │
            │                    ▼
            │              Bangla transcript
            │                    │
            ├──────────────► Gemma 4 E2B
            │                    │
            │                    ▼
            │              Structured JSON
            │
            ▼
┌─────────────────────────────────────┐
│              MongoDB                │
│                                     │
│ customers                           │
│ orders                              │
│ ledgerentries                       │
└─────────────────────────────────────┘
```

---

## Tech Stack

| Layer                     | Technology                  |
| ------------------------- | --------------------------- |
| Backend                   | Node.js + Express           |
| Database                  | MongoDB                     |
| ODM                       | Mongoose                    |
| AI Model                  | Gemma 4 E2B, locally hosted |
| Speech-to-Text            | Bangla ASR                  |
| Frontend                  | HTML, CSS, and JavaScript   |
| Audio Capture             | Browser `MediaRecorder` API |
| Development Database Tool | MongoDB Compass             |
| Environment Configuration | `dotenv`                    |
| Development Server        | Nodemon                     |

### Platform Note

This repository is a web application proof of concept.

The production version is intended to become an Android-first mobile application or Progressive Web App because most local shop owners access digital services through smartphones.

An offline-first architecture is also important because of:

* Load-shedding
* Inconsistent internet connectivity
* Limited mobile data
* Unreliable network availability inside local shops

The web proof of concept exists to demonstrate the complete:

```text
Voice → Transcript → Gemma → Order → Ledger
```

pipeline within the hackathon timeframe.

---

## Database Design

The current MVP uses three MongoDB collections:

```text
kotha_khata
├── customers
├── orders
└── ledgerentries
```

Orders are stored separately from customers and linked using MongoDB ObjectIds.

This structure:

* Prevents customer documents from growing indefinitely.
* Makes daily sales queries easier.
* Keeps order records independent.
* Supports direct ledger tracking.
* Makes future reporting and analytics easier.

---

### `customers` Collection

```json
{
  "_id": "ObjectId",
  "name": "Kamal Hossain",
  "normalizedName": "kamal hossain",
  "phone": "01XXXXXXXXX",
  "outstandingBaki": 300,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### Important Fields

| Field             | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `name`            | Customer display name                       |
| `normalizedName`  | Lowercase normalized name used for matching |
| `phone`           | Customer phone number                       |
| `outstandingBaki` | Current unpaid debt                         |
| `createdAt`       | Profile creation time                       |
| `updatedAt`       | Last profile update                         |

---

### `orders` Collection

```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId",
  "items": [
    {
      "name": "Rice packet",
      "quantity": 2,
      "unitPrice": 60,
      "subtotal": 120
    },
    {
      "name": "Oil",
      "quantity": 1,
      "unitPrice": 180,
      "subtotal": 180
    }
  ],
  "total": 300,
  "paymentType": "BAKI",
  "paidAmount": 0,
  "bakiAmount": 300,
  "rawTranscript": "কামাল দুইটা চালের প্যাকেট আর একটা তেল বাকিতে নিল",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### Payment Types

```text
CASH
BAKI
```

A partial payment is represented using:

```text
total > paidAmount > 0
bakiAmount = total - paidAmount
```

Cash orders may have no customer ID.

Baki orders must have a valid customer ID.

---

### `ledgerentries` Collection

```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId",
  "orderId": "ObjectId",
  "type": "BAKI_ADDED",
  "amount": 300,
  "note": "Baki added from order",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### Ledger Entry Types

| Type           | Meaning                      |
| -------------- | ---------------------------- |
| `SALE`         | A new sale was recorded      |
| `BAKI_ADDED`   | Debt was added to a customer |
| `BAKI_PAYMENT` | A customer repaid debt       |

A baki order normally creates two ledger entries:

```text
SALE
BAKI_ADDED
```

A debt repayment creates:

```text
BAKI_PAYMENT
```

---

### Daily Summary

The MVP does not store a separate `daily_summary` collection.

The summary is calculated on demand using:

```text
GET /api/summary/today
```

This avoids maintaining an additional write path during the hackathon.

A cached daily summary collection may be introduced later if reporting performance becomes important.

---

### Planned Product Catalog

The MVP stores product names as free text inside each order.

A future `products` collection may contain:

```json
{
  "_id": "ObjectId",
  "name": "Rice",
  "aliases": ["chal", "চাল"],
  "unit": "kg",
  "defaultUnitPrice": 60,
  "stockQuantity": 100
}
```

This will support:

* Automatic price lookup
* Product name matching
* Inventory tracking
* Low-stock warnings
* Bangla and English aliases

---

## API Endpoints

### Health Check

```http
GET /
```

Example response:

```json
{
  "message": "KothaKhata API is running"
}
```

---

### Find or Create Customer

```http
POST /api/customers/find-or-create
```

Request:

```json
{
  "name": "Rahim",
  "phone": "01711111111"
}
```

Existing customer response:

```json
{
  "created": false,
  "customer": {
    "_id": "ObjectId",
    "name": "Rahim",
    "outstandingBaki": 200
  }
}
```

New customer without a phone number:

```json
{
  "created": false,
  "requiresPhone": true,
  "message": "Phone number is required for a new customer"
}
```

---

### Create Order

```http
POST /api/orders
```

Cash order example:

```json
{
  "paymentType": "CASH",
  "rawTranscript": "Two rice packets sold for 100 each",
  "items": [
    {
      "name": "Rice packet",
      "quantity": 2,
      "unitPrice": 100
    }
  ]
}
```

Baki order example:

```json
{
  "customerId": "CUSTOMER_OBJECT_ID",
  "paymentType": "BAKI",
  "paidAmount": 0,
  "rawTranscript": "Karim bought three drinks on baki",
  "items": [
    {
      "name": "Drink",
      "quantity": 3,
      "unitPrice": 50
    }
  ]
}
```

Response:

```json
{
  "message": "Order saved successfully",
  "order": {
    "total": 150,
    "paidAmount": 0,
    "bakiAmount": 150,
    "paymentType": "BAKI"
  }
}
```

---

### Record Baki Repayment

```http
POST /api/customers/:id/pay-baki
```

Request:

```json
{
  "amount": 200
}
```

Response:

```json
{
  "message": "Baki payment recorded",
  "paidAmount": 200,
  "outstandingBaki": 250
}
```

---

### Get End-of-Day Summary

```http
GET /api/summary/today
```

Response:

```json
{
  "date": "2026-07-26",
  "totalSales": 4500,
  "totalCashReceived": 3200,
  "totalBakiAdded": 1300,
  "totalBakiOutstanding": 2500,
  "topDebtors": [
    {
      "_id": "ObjectId",
      "name": "Kamal Hossain",
      "outstandingBaki": 500
    }
  ]
}
```

---

## Getting Started

### Requirements

Install:

* Node.js
* npm
* MongoDB Community Server
* MongoDB Compass
* Git

---

### Clone the Repository

```bash
git clone https://github.com/sabit007/gemma-hackathon.git
cd gemma-hackathon
```

---

### Open the Backend

```bash
cd backend
npm install
```

---

### Configure Environment Variables

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kotha_khata
```

Do not commit the `.env` file.

---

### Start MongoDB

Open MongoDB Compass and connect using:

```text
mongodb://localhost:27017
```

The database and collections are created automatically when the backend performs its first write.

---

### Start the Backend

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Expected output:

```text
Server running on port 5000
MongoDB connected
```

The API will be available at:

```text
http://localhost:5000
```

---

## Demo Flow

### Scenario 1: New Customer Baki Order

The shopkeeper says:

> “করিম তিনটা ড্রিংক পঞ্চাশ টাকা করে বাকিতে নিল।”

The system:

1. Transcribes the audio.
2. Extracts Karim, three drinks, and ৳50 per item.
3. Searches for Karim.
4. Requests a phone number if Karim is new.
5. Creates the customer.
6. Creates a ৳150 order.
7. Adds ৳150 to Karim’s outstanding baki.

---

### Scenario 2: Returning Customer Order

The shopkeeper says:

> “করিম দুইটা বিস্কুট নিল, টাকা দিয়ে দিয়েছে।”

The system:

1. Finds Karim using the normalized name.
2. Creates the new order.
3. Marks the order as paid.
4. Does not increase Karim’s baki.

---

### Scenario 3: Baki Repayment

The shopkeeper says:

> “করিম দুইশো টাকা বাকি পরিশোধ করেছে।”

The system:

1. Finds Karim.
2. Validates the payment amount.
3. Reduces Karim’s outstanding baki.
4. Creates a `BAKI_PAYMENT` ledger entry.

---

### Scenario 4: End-of-Day Summary

The shopkeeper asks:

> “আজকের হিসাব বলো।”

The application displays or reads:

* Total sales
* Total collected
* Total baki added
* Total outstanding baki
* Top debtors

---

## Future Plans

* Android-first mobile application
* Progressive Web App support
* Offline-first transaction recording
* On-device Gemma inference
* Local database synchronization
* Regional Bangla dialect support
* Improved customer matching using phone numbers and fuzzy search
* Bangla text-to-speech confirmations
* Customer SMS notifications
* Automated baki reminders
* bKash and Nagad payment reconciliation
* Product catalog and automatic pricing
* Inventory management
* Low-stock alerts
* Supplier ledger
* Receipt generation
* PDF and Excel exports
* Multi-shop support
* User authentication and employee roles
* Cloud backup and synchronization
* Voice-based owner verification

---

## Current Limitations

* Customer matching currently uses exact normalized-name matching.
* Customers with the same name are not yet disambiguated automatically.
* Product names are stored as free text.
* Product units are not yet stored in the current order schema.
* Product prices must currently be provided by Gemma or the user.
* Regional Bangla dialect accuracy has not been fully evaluated.
* Background shop noise may reduce transcription accuracy.
* The current backend has no authentication or authorization.
* MongoDB transactions are not yet used for multi-document writes.
* The current prototype depends on the backend and database being online.
* The application has not yet been tested with real shop owners in a production environment.

---

## Project Status

### Completed Backend MVP

* MongoDB connection
* Customer model
* Order model
* Ledger entry model
* Customer lookup and creation
* Cash order processing
* Baki order processing
* Partial payment calculation
* Running baki updates
* Baki repayments
* End-of-day summary
* API testing

### Integration in Progress

* Browser audio recording
* Bangla speech-to-text
* Gemma 4 E2B structured parsing
* Frontend confirmation flow
* End-to-end voice-to-ledger integration

---

Built for the **Build With Gemma @ Bangladesh Hackathon — Native Audio & Voice Track**.

```
```

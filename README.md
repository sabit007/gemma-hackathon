# KothaKhata

**Voice-first bookkeeping for local shop owners, powered by Gemma.**

KothaKhata (কথা খাতা — "spoken ledger") lets small shop owners (*mudi dokan* / *dokandar*) log daily sales and customer credit (*baki*) simply by speaking, in Bangla, the way they already talk to their customers — no typing, no forms, no app literacy required.

Built for **Build With Gemma @ Bangladesh** — Track 6: Native Audio & Voice.

---

## Table of Contents
- [Problem](#problem)
- [Solution](#solution)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Demo Flow](#demo-flow)
- [Future Plans](#future-plans)
- [Limitations](#limitations)

---

## Problem

Most neighborhood shops in Bangladesh run their ledgers on paper — sales, and critically, **baki** (informal customer credit), tracked by memory and handwriting. This creates real friction:
- No easy way to see who owes what, or how much stock/cash moved today
- Digital POS tools assume typing, English, and a level of digital literacy many shop owners don't have or want to use
- Existing apps rarely fit how these shops actually operate: fast, conversational, trust-based transactions

KothaKhata's premise: the shopkeeper shouldn't have to change how they work. The app should listen.

## Solution

A voice-first web app where a shopkeeper speaks an order naturally in Bangla — e.g. *"Kamal bhai ke 2 kg chal ar 1 litre tel dilam, baki rakhlo"* — and the app:
1. Transcribes the speech
2. Uses **Gemma** to parse it into structured order data
3. Matches or creates the customer profile
4. Calculates the bill
5. Logs it as paid, partial, or baki
6. Rolls everything into an end-of-day summary

## Features

### Core (MVP)
- 🎙️ **Voice order capture** — speak an order in Bangla, get it transcribed and parsed automatically
- 👤 **Automatic customer profiles** — matches existing customers by name, or creates a new profile (name + phone) on the fly
- 🧾 **Itemized bill generation** — tracks items, quantities, units, and prices per order
- 💰 **Baki (credit) tracking** — mark orders as paid, partial, or full credit; running debt per customer
- 📊 **End-of-day summary** — total sales, total collected, total outstanding baki, top debtors
- ⌨️ **Text fallback** — if audio is unclear or unavailable, type the order instead; same parsing pipeline

### Planned / Extended
See [Future Plans](#future-plans).

## Architecture

```
Browser (mic recording via MediaRecorder API)
        │  audio blob
        ▼
Express backend
        │
        ├─► Speech-to-Text (Bangla) ──► transcript
        │
        ├─► Gemma (via Gemini API) ──► structured JSON
        │       { customer_name, phone?, items[], payment_status, amount_paid }
        │
        ├─► NoSQL ──► match/create customer → create order → update ledger
        │
        └─► Response ──► bill summary + confirmation shown in browser
```

If transcription fails or is low-confidence, the frontend falls back to a plain text input, using the same downstream parsing and DB pipeline.

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | NoSQL |
| AI Model | Gemma (via Gemini API) |
| Speech-to-Text | Bangla ASR (transcription step ahead of Gemma prompt) |
| Frontend | HTML/CSS/JS, mobile-first responsive |
| Audio Capture | Browser `MediaRecorder` API |

**Platform note:** This repo is a **web app proof-of-concept**. Production is intended as a native/PWA **mobile app**, since Mudi Dokan owners predominantly access smartphones rather than desktops, and offline-first behavior matters given load-shedding and inconsistent connectivity in many areas. The web PoC exists to demonstrate the full voice → ledger pipeline quickly; see [Future Plans](#future-plans) for the mobile roadmap.

## Database Schema

**customers**
| Column | Type |
|---|---|
| id | PK |
| name | text |
| phone | text |
| created_at | timestamp |

**orders**
| Column | Type |
|---|---|
| id | PK |
| customer_id | FK → customers |
| created_at | timestamp |
| total_amount | number |
| paid_amount | number |
| status | `paid` \| `partial` \| `baki` |

**order_items**
| Column | Type |
|---|---|
| id | PK |
| order_id | FK → orders |
| product_name | text (free-text for MVP) |
| quantity | number |
| unit | text |
| unit_price | number |
| line_total | number |

`products` as a first-class catalog table is a planned extension (see below) — MVP stores product names as free text on `order_items` to avoid a fragile matching step under time pressure.

## Getting Started

```bash
git clone <repo-url>
cd kothakhata
npm install
cp .env.example .env   # add your Gemini API key
npm run init-db        # creates SQLite tables
npm start
```

Open `http://localhost:3000` in a browser (or your phone, on the same network, for the mobile-sized experience).

## Demo Flow

1. New customer speaks an order → profile created, bill generated, marked as baki
2. Returning customer speaks a second order → profile recognized automatically, marked as paid
3. End-of-day summary reviewed — total sales, total baki outstanding, top debtors

## Future Plans

- **Native mobile app** (Android-first, PWA or React Native) as the primary production platform
- **Offline-first / on-device inference** — local model + local DB caching for use during load-shedding or poor connectivity (aligned with the Edge/On-Device track approach)
- **Voice-based speaker verification** — confirm it's actually the shop owner before allowing ledger edits
- **Supplier hishab via photo** — snap a photo of a supplier's handwritten invoice, extract line items, and auto-update inventory/stock
- **SMS integration** — send bill/baki confirmations to customers without smartphones
- **Baki alerts** — proactive reminders to shop owners (and optionally customers) about outstanding debt
- **bKash payment capture** — detect and reconcile mobile financial service payments automatically against orders
- **Formal product catalog** — structured `products` table with per-unit pricing, replacing free-text item entry

## Limitations

- Speech-to-text accuracy for regional Bangla dialects and background noise (a real shop is noisy) hasn't been rigorously benchmarked yet
- Customer matching by name is simple string matching in the MVP; ambiguity (common names) isn't yet handled
- No authentication/security layer — anyone with the link can currently use the app
- Not yet tested with real shop owners in a live environment; validation so far is scripted demo scenarios

---

Built for the **Build With Gemma @ Bangladesh** hackathon, Native Audio & Voice track.

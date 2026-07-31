# FinRoute Frontend — Smart Daily Finance & Collection ERP Platform

FinRoute is a next-generation FinTech SaaS platform tailored for daily money lending businesses, microfinance operators, field collection agents, and financial enterprises across India.

---

## 🏗️ Architecture Overview

The frontend is built as a responsive, SPA/SSR-ready application using React 18, Vite, and TanStack Router:

```
┌─────────────────────────────────────────────────────────────┐
│                    FinRoute Frontend                        │
│   React 18 + TypeScript + Vite + TanStack Router + Tailwind │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON) / JWT Auth
┌──────────────────────────────▼──────────────────────────────┐
│                    FinRoute Backend                         │
│       Python 3.11+ / Django 5.1 / Django REST Framework     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Feature Suite

### 1. Guest Workspace (Single-Lender ERP Suite)
- **Borrower Account Management**: Register and manage loan accounts with custom interest rates, principal amounts, frequencies (`Daily`, `Weekly`, `Monthly`), and automatic customer sequence numbers.
- **Digital Collection Passbook**: Interactive visual passbook grid displaying real-time paid vs. remaining installments for every borrower.
- **Day-Wise Route Management**: Filter and manage collection routes by operating day (`Monday` through `Sunday`).
- **Self-Service Route Re-mapping**: Re-configure workspace collection days at any time with automatic active borrower route re-mapping in the database.
- **Expense & Daily Collections Tracking**: Separate Today's vs. Monthly expense metrics and dynamic collection receipts.

### 2. Export & Reporting
- **Excel-Safe CSV Export**: One-click borrower export with clean text mobile number formatting (`="9876543210"`).
- **Per-Installment Breakdown**: Dynamically appends individual installment payment dates and collected amounts as dedicated CSV table columns.

### 3. Plan Upgrades & WhatsApp Integration
- **Plan Upgrade Requests**: Lenders can select collection day plans on `/app/upgrade`, which submits a `pending` request in the database.
- **WhatsApp Inquiry Flow**: Pre-filled WhatsApp integration using configurable environment variables for instant support.
- **Admin Approval & Auto-Activation**: Super Admin approval workflow for activating upgraded collection day plans.

### 4. Super Admin Governance Console (`/admin`)
- **Lender & Workspace Management**: Override quotas, reset passwords, suspend, or update lender workspaces.
- **Customer Review Moderation**: Moderate public customer reviews (`Pending`, `Approved`, `Rejected`) before displaying on the landing page.
- **Upgrade Request Moderation**: Review pending plan upgrade requests submitted by lenders with 1-click **Approve & Activate** or **Reject** buttons.
- **Audit Logs & System Health**: Real-time system monitoring and operational audit tracking.

### 5. Marketing & Public Pages
- **Modern Landing Page**: High-converting, responsive design featuring platform highlights, reviews, and plan tiers.
- **Interactive Loan Calculator**: Real-time principal, interest, and weekly installment calculator.
- **Public FAQ Page**: Comprehensive Indian finance operational questions and answers.

---

## 🚀 Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + React 18 + [TanStack Router](https://tanstack.com/router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI Components
- **Icons**: Lucide React Icons
- **State & Data Fetching**: TanStack Query / Custom Service Layer
- **Formatters**: Native `Intl.NumberFormat` for Indian Rupee (`₹`) formatting

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WHATSAPP_NUMBER=91XXXXXXXXXX
VITE_WHATSAPP_SUPPORT_NUMBER=91XXXXXXXXXX
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

The frontend app will be running at `http://localhost:8080`.

---

## 📄 License

This project is licensed under the MIT License.

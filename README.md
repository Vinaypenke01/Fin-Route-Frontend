# FinRoute Frontend — Smart Daily Finance & Collection ERP Platform

FinRoute is a next-generation FinTech SaaS platform tailored for daily money lending businesses, microfinance operators, field agents, and finance enterprises across India.

---

## 🌟 Key Features

### 1. Guest Workspace (Single-Lender Suite)
- **Unlimited Borrowers**: Register and manage loan accounts with custom interest rates, principal amounts, and collection schedules.
- **Digital Collection Passbook**: Interactive installment progress grid displaying real-time paid vs. remaining installments.
- **Day-Wise Route Management**: Filter and manage collection routes by operating day (`Monday` through `Sunday`).
- **Flexible Route Re-mapping**: Self-service collection day re-configuration with automatic route re-mapping for active borrowers.
- **Expense & Daily Collections Tracking**: Separate Today's vs. Monthly expense metrics and dynamic collection receipts.

### 2. Export & Reporting
- **Excel-Safe CSV Export**: One-click borrower export with clean mobile number formatting (`="9876543210"`).
- **Per-Installment History**: Dynamically appends individual installment payment dates and collected amounts as dedicated CSV table columns.

### 3. Plan Upgrades & WhatsApp Integration
- **Plan Upgrade Requests**: Lenders can request plan upgrades to increase weekly collection days.
- **WhatsApp Inquiry Flow**: Pre-filled WhatsApp integration using configurable environment variables for instant support.
- **Admin Moderation**: Super Admin approval workflow for activating upgraded collection day plans.

### 4. Super Admin Console (`/admin`)
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

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WHATSAPP_NUMBER=918978388567
VITE_WHATSAPP_SUPPORT_NUMBER=918978388567
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

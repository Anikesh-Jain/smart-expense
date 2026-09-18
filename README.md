# Smart Expense

> Full-stack personal finance platform for expense tracking, budgeting, savings planning, analytics, and multi-currency financial management.

## Overview

**Smart Expense** is a full-stack personal finance web application for tracking expenses, managing budgets, planning savings goals, and analyzing financial activity across multiple currencies.

The application uses **USD as the canonical base currency** while preserving original financial records and historical exchange-rate information.

## Features

### Authentication & Security
- Registration, login, logout
- JWT authentication
- bcrypt password hashing
- Forgot-password and secure password-reset flow
- Brevo SMTP password-reset emails
- Protected routes and ownership checks
- Rate limiting for login, registration, and password recovery
- Helmet and CORS security

### Financial Management
- Monthly income, fixed expenses, savings target, and payday configuration
- Income and expense transactions
- Categories, search, filtering, sorting, and date filtering
- Edit and delete transactions
- Monthly budgets with category limits
- Savings goals with target dates and contributions
- Spending and savings analytics
- Spending pace and safe daily spending limit
- Financial health calculations and saving suggestions

### Multi-Currency Architecture

Smart Expense does **not** treat currency as a cosmetic symbol switch.

The canonical base currency is **USD**.

Transactions preserve:
- Original amount
- Original currency
- `baseAmountUSD`
- Historical exchange rate to USD

Budgets preserve:
- Native currency
- `baseBudgetUSD`

Savings goals preserve:
- Native goal currency
- Contribution currency
- Converted contribution amount
- Exchange-rate snapshot
- Rate timestamp/provider

The user's display-currency change affects presentation only; original financial records remain immutable.

Supported currencies:

`INR` · `USD` · `EUR` · `GBP` · `CAD` · `AUD` · `JPY`

Exchange rates use a live provider with 1-hour caching, fallback reference rates, and rate provenance.

### Admin & Account Management
- Role-based admin dashboard
- Server-side admin authorization
- User management
- Feedback management
- User feedback submission and history
- Secure account deletion
- Cascading cleanup of user-owned financial data
- User data isolation

### CSV Export

`GET /api/transactions/export`

Exports:
- Date
- Type
- Amount
- Currency
- Display Amount
- Category
- Description

Supports active filters/search, RFC 4180 CSV escaping, empty results, and does not mutate database data.

## Tech Stack

**Frontend**
- React 19
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Recharts
- Axios
- oxlint

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

**Authentication & Security**
- JWT
- bcrypt
- Helmet
- express-rate-limit
- CORS

**Email**
- Nodemailer
- Brevo SMTP

**Testing**
- Node.js built-in test runner

## Project Structure

```text
smart-expense/
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── app/
│       ├── components/
│       ├── context/
│       ├── features/
│       ├── pages/
│       └── utils/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── tests/
│   └── utils/
│
└── .gitignore
```

## Verification

The completed baseline was verified with:

- **187/187 backend tests passing**
- **29 test suites**
- **0 failures**
- **oxlint: 0 warnings, 0 errors**
- **64 frontend files checked**
- **Vite production build successful**
- **719 modules transformed**
- **Final end-to-end dry run: PASS**

Verified areas include authentication, onboarding, password reset, transactions, multi-currency conversion and switching, budgets, savings goals, contributions, analytics, spending pace, saving plan, settings, admin RBAC, feedback, account deletion, CSV export and escaping, user isolation, and production build/lint.

## Local Development

### Clone

```bash
git clone https://github.com/Anikesh-Jain/smart-expense.git
cd smart-expense
```

### Frontend

```bash
cd client
npm install
```

Configure the required variables from `client/.env.example`.

### Backend

```bash
cd ../server
npm install
```

Configure the required variables from `server/.env.example`.

### Run

Start the backend:

```bash
cd server
npm run dev
```

In a second terminal, start the frontend:

```bash
cd client
npm run dev
```

## Security Notes

Environment files and local secrets are excluded from version control.

For deployment, configure production secrets, MongoDB, CORS origins, SMTP credentials, and application URLs. Never commit `.env` files or credentials.

## Project Status

**Completed baseline — production-ready application.**

Future changes should preserve the existing authentication/security model, multi-currency architecture, user isolation, and passing test suite.

---

Built with React, Node.js, Express, MongoDB, and a focus on practical financial software architecture.

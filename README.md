# KEORA – A Fintech Project 

### Finance Reimagined

KEORA is a full-stack fintech application designed to simulate digital payment and transaction management. It provides a secure environment for users to manage transactions, monitor balances and understand their spending through financial analytics.

> **Note:** KEORA is an educational fintech simulation. It does not process real payments or transfer actual money.

---

## ✨ Features

- **User Authentication:** Secure registration and login using JWT and bcrypt password hashing.
- **Transaction Management:** Create, view and manage financial transactions.
- **Balance Management:** User-specific balance tracking with PostgreSQL.
- **Payment Simulation:** Simulate income, expenses and transfers.
- **Idempotency Protection:** Prevent duplicate payment processing using unique idempotency keys.
- **Transaction Search:** Search transactions by recipient and transaction details.
- **Category Filtering:** Organise transactions into different categories.
- **Financial Analytics:** Monitor income, expenses and category-wise spending.
- **CSV Export:** Download transaction statements.
- **Responsive Interface:** Designed for different screen sizes.
- **Accessibility:** Includes large-text and high-contrast options.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| API | REST API |
| Testing | Node.js Test Runner |
| Code Quality | ESLint |
| Version Control | Git, GitHub |

---

## 🏗️ Architecture

KEORA follows a client-server architecture.

```text
              KEORA
                 |
        React Frontend
                 |
          REST API Calls
                 |
        Node.js + Express
                 |
       Authentication Layer
                 |
          PostgreSQL
                 |
       Users & Transactions
```

---

## 🔐 Security and Reliability

KEORA implements several backend safeguards:

- Password hashing with bcrypt.
- JWT-based authentication.
- Parameterised SQL queries.
- User-specific transaction access.
- Database transactions for balance updates.
- Row-level locking to protect against concurrent overspending.
- Idempotency keys to prevent duplicate payment processing.
- Input validation for transaction requests.

---

## 🧪 Automated Testing

KEORA includes automated backend API tests using Node.js's built-in test runner.

Current test coverage includes:

| Test | Status |
|---|---|
| API health check | Passed |
| Database connectivity | Passed |
| User registration | Passed |
| User login | Passed |
| Incorrect password rejection | Passed |
| Authentication protection | Passed |
| Payment creation | Passed |
| Balance deduction | Passed |
| Duplicate payment prevention | Passed |
| Idempotency conflict handling | Passed |
| Insufficient balance rejection | Passed |

**Latest test result: 11 passed, 0 failed.**

Run the tests using:

```bash
npm test
```

The backend must be running and connected to the test database.

---

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/keekode18/KEORA-Fintech-Project.git
```

### 2. Navigate into the project

```bash
cd KEORA-Fintech-Project
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

Use `server/.env.example` as your reference.

Configure your PostgreSQL credentials and a strong, private JWT secret.

### 5. Set up PostgreSQL

Create a PostgreSQL database named:

```text
keora
```

Create the required `users` and `transactions` tables using the project database schema.

### 6. Start the backend

```bash
node server/server.js
```

The API runs at:

```text
http://localhost:5000
```

### 7. Start the frontend

Open another terminal:

```bash
npm run dev
```

Open the local Vite URL displayed in your terminal.

---

## 📁 Project Structure

```text
KEORA/
│
├── public/
│
├── server/
│   ├── auth.js
│   ├── db.js
│   ├── middleware.js
│   ├── server.js
│   ├── transactions.js
│   └── .env.example
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── tests/
│   └── api.test.js
│
├── .gitignore
├── eslint.config.js
├── package.json
├── README.md
└── vite.config.js
```

---

## 🚀 Future Improvements

- Enhanced transaction security and monitoring.
- Advanced financial analytics.
- Improved automated test coverage.
- Deployment and production infrastructure.
- Additional payment-system simulations.

---





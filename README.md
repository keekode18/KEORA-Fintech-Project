# KEORA – A Fintech Application

Finance Reimagined...

KEORA is a full-stack fintech application that simulates digital payments and transaction management. It enables users to manage financial transactions, monitor account balances, analyse spending patterns, and explore payment-system workflows through a responsive web interface.

**KEORA is an educational fintech simulation. It does not process real payments or transfer actual money.**

## Live Application

- **Live Demo:** https://keora-fintech-project.vercel.app
- **Backend API:** https://keora-api.onrender.com
- **Source Code:** https://github.com/keekode18/KEORA-Fintech-Project

## Key Features

### Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API endpoints.

### Transaction Management
- Simulated income, expenses, and transfers.
- Transaction history and detailed transaction views.
- Search and category-based filtering.
- CSV statement downloads.

### Balance Management
- Individual user balances.
- Automatic balance updates for completed transactions.
- Insufficient balance validation.
- PostgreSQL-backed transaction records.

### Reliability
- Idempotency keys to prevent duplicate payment processing.
- Database transactions for consistent balance updates.
- Row-level locking for concurrent balance operations.
- Input validation and parameterised SQL queries.

### Financial Analytics
- Income and expense summaries.
- Monthly transaction insights.
- Category-wise spending breakdown.

### User Experience
- Responsive interface.
- Large-text accessibility option.
- High-contrast accessibility option.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Build Tool | Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| API | REST |
| Testing | Node.js Test Runner |
| Code Quality | ESLint |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Neon |

## System Architecture

KEORA follows a client-server architecture.

```text
              User
               |
               v
        React Frontend
          (Vercel)
               |
               v
          REST API
               |
               v
       Express Backend
           (Render)
               |
        Authentication
        & Validation
               |
               v
       PostgreSQL Database
             (Neon)
```

## Security and Reliability

The application implements:

- Bcrypt password hashing.
- JWT-based authentication.
- Protected, user-specific transaction access.
- Parameterised SQL queries.
- Database transactions for payment operations.
- Row-level locking during balance updates.
- Idempotency-key-based duplicate request protection.
- Transaction input validation.

These safeguards are implemented for an educational simulation and should not be interpreted as a production financial security certification.

## Automated Testing

The backend includes automated API integration tests using Node.js's built-in test runner.

| Test Case | Result |
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

**Latest recorded test result: 11 passed, 0 failed.**

Run tests locally:

```bash
npm test
```

The backend must be running and connected to the test database.

## Local Installation

### Prerequisites

- Node.js
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/keekode18/KEORA-Fintech-Project.git
cd KEORA-Fintech-Project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server` directory.

Use `server/.env.example` as a reference.

Configure your PostgreSQL connection details and a strong, private JWT secret. Never commit actual credentials or secrets.

For local development, configure the frontend API URL only if you need to override its default:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Set up the database

Create a PostgreSQL database named `keora`.

Create the `users` and `transactions` tables using the schema required by the backend.

### 5. Start the backend

```bash
node server/server.js
```

The backend runs at:

```text
http://localhost:5000
```

### 6. Start the frontend

Open another terminal and run:

```bash
npm run dev
```

Open the local Vite URL displayed in the terminal.

## Project Structure

```text
KEORA/
│
├── public/
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
├── package-lock.json
├── README.md
└── vite.config.js
```

## Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

The frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

## Future Enhancements

- Expanded financial analytics.
- Additional transaction monitoring.
- More comprehensive automated testing.
- Enhanced payment-system simulations.

## Author

Developed as a full-stack fintech engineering project to explore authentication, transaction processing, database consistency, API design, and deployment.

**KEORA – Finance, Reimagined.**


import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";



const CATEGORIES = [
  "All categories",
  "Food & Drink",
  "Shopping",
  "Income",
  "Transfer",
  "Utilities",
];

const money = (paise) =>
  (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

const csvCell = (value) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

function App() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Authentication state
  const [token, setToken] = useState(() => localStorage.getItem("keora_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("keora_user") || "null");
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = authMode === "login" ? "login" : "register";
    const payload = authMode === "login"
      ? { email: authEmail.trim().toLowerCase(), password: authPassword }
      : { full_name: authName.trim(), email: authEmail.trim().toLowerCase(), password: authPassword };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");

      if (authMode === "register") {
        setAuthMode("login");
        setAuthPassword("");
        setAuthError("Account created successfully. Please log in.");
        return;
      }

      localStorage.setItem("keora_token", data.token);
      localStorage.setItem("keora_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuthPassword("");
    } catch (error) {
      setAuthError(error.message || "Unable to authenticate.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("keora_token");
    localStorage.removeItem("keora_user");
    setToken(null);
    setUser(null);
    setTransactions([]);
    setIsLoading(false);
    setActiveTab("Overview");
  }

  const [showBalance, setShowBalance] = useState(true);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactions, setTransactions] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState("");
  const [balancePaise, setBalancePaise] = useState(10000000000);
  useEffect(() => {
  if (!token) return;

  async function fetchBalance() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/balance`,
        {
         headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
        }
      );

      if (!response.ok) {
        throw new Error("Unable to fetch account balance");
      }

      const data = await response.json();

      setBalancePaise(Number(data.balancePaise));
    } catch (error) {
      console.error("Balance error:", error);
    }
  }

  fetchBalance();
}, [token]);
  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      if (!token) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          handleLogout();
          throw new Error("Your session has expired. Please log in again.");
        }
        if (!response.ok) throw new Error("Unable to load transactions");

        const data = await response.json();
        const formattedTransactions = data.map((item) => ({
          id: item.id,
          name: item.recipient,
          category: item.category,
          date: new Date(item.created_at).toLocaleString("en-IN"),
          amount: (item.transaction_type === "income" ? 1 : -1) * Math.round(Number(item.amount) * 100),
          status: item.status,
        }));

        if (!cancelled) {
          setTransactions(formattedTransactions);
          setLoadError("");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setLoadError(error.message || "Unable to connect to KEORA database.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadTransactions();
    return () => { cancelled = true; };
  }, [token]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All categories");

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const navigation = [
    "Overview",
    "Transactions",
    "Payments",
    "Insights",
  ];

  // Only completed transactions count in actual income and spending.
  const completedTransactions = useMemo(
    () => transactions.filter((item) => item.status === "Completed"),
    [transactions]
  );

  // Calculate income, expenses and category totals.
  const analytics = useMemo(() => {
    const income = completedTransactions
      .filter((item) => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = completedTransactions
      .filter((item) => item.amount < 0)
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const categoryTotals = {};

    completedTransactions
      .filter((item) => item.amount < 0)
      .forEach((item) => {
        categoryTotals[item.category] =
          (categoryTotals[item.category] || 0) +
          Math.abs(item.amount);
      });

    return {
      income,
      expenses,
      categoryTotals,
    };
  }, [completedTransactions]);

  // Search and category filtering.
  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All categories" ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, selectedCategory]);

  function openPayment() {
    setPaymentError("");
    setRecipient("");
    setAmount("");
    setShowPayment(true);
  }

  async function makePayment(event) {
  event.preventDefault();

  if (isSubmitting) return;

  const cleanRecipient = recipient.trim();
  const numericAmount = Number(amount);

  if (!cleanRecipient || cleanRecipient.length > 60) {
    setPaymentError("Enter a valid recipient name.");
    return;
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    setPaymentError("Enter a valid amount greater than ₹0.");
    return;
  }

  const amountInPaise = Math.round(numericAmount * 100);

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
    setPaymentError("Enter a valid payment amount.");
    return;
  }

  if (amountInPaise > balancePaise) {
    setPaymentError("Insufficient demo balance.");
    return;
  }

  setIsSubmitting(true);
  setPaymentError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          recipient: cleanRecipient,
          category: "Transfer",
          amount: numericAmount,
          transaction_type: "transfer",
          status: "Completed",
          description: "KEORA simulated payment",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Payment failed");
    }

    const saved = data.transaction;

    const newTransaction = {
      id: saved.id,
      name: saved.recipient,
      category: saved.category,
      date: new Date(saved.created_at).toLocaleString("en-IN"),
      amount: -Math.round(Number(saved.amount) * 100),
      status: saved.status,
    };
setBalancePaise(Number(data.balancePaise));

    setTransactions((previous) => [
      newTransaction,
      ...previous,
    ]);

    setSelectedTransaction(newTransaction);
    setSearchTerm("");
    setSelectedCategory("All categories");
    setShowPayment(false);
    setActiveTab("Transactions");

  } catch (error) {
    console.error(error);
    setPaymentError(error.message || "Unable to process payment.");
  } finally {
    setIsSubmitting(false);
  }
}

  // Download the currently displayed transactions as a CSV file.
  function downloadStatement() {
    const headers = [
      "Transaction ID",
      "Recipient",
      "Category",
      "Date",
      "Amount (INR)",
      "Status",
    ];

    const rows = filteredTransactions.map((item) => [
      item.id,
      item.name,
      item.category,
      item.date,
      (item.amount / 100).toFixed(2),
      item.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `KEORA-statement-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const largestCategoryAmount = Math.max(
    1,
    ...Object.values(analytics.categoryTotals)
  );

  if (!token) {
    return (
      <div className="app-shell auth-screen" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <section className="auth-card" style={{ width: "100%", maxWidth: "440px", padding: "36px", borderRadius: "20px", background: "white", boxShadow: "0 18px 60px rgba(30, 20, 60, 0.12)" }}>
          <div className="brand">
            <div className="brand-icon">K</div>
            <span>KEORA<span className="brand-dot">.</span></span>
          </div>
          <h1 style={{ marginTop: "30px" }}>{authMode === "login" ? "Welcome back." : "Create your account."}</h1>
          <p>{authMode === "login" ? "Log in to access your financial space." : "Create your KEORA account."}</p>
          <form onSubmit={handleAuth} style={{ display: "grid", gap: "12px", marginTop: "24px" }}>
            {authMode === "register" && (
              <>
                <label htmlFor="authName">Full name</label>
                <input id="authName" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Enter your full name" required maxLength={100} />
              </>
            )}
            <label htmlFor="authEmail">Email address</label>
            <input id="authEmail" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Enter your email" required autoComplete="email" />
            <label htmlFor="authPassword">Password</label>
            <input id="authPassword" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={authMode === "login" ? "current-password" : "new-password"} />
            {authError && <p className="payment-error" role="alert">{authError}</p>}
            <button className="primary-btn" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : authMode === "login" ? "Log in →" : "Create account →"}
            </button>
          </form>
          <p style={{ marginTop: "22px" }}>
            {authMode === "login" ? "New to KEORA? " : "Already have an account? "}
            <button type="button" className="text-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
              {authMode === "login" ? "Create account" : "Log in"}
            </button>
          </p>
          <p className="demo-note" style={{ marginTop: "20px" }}>KEORA is a payment simulation. No real money is transferred.</p>
        </section>
      </div>
    );
  }

  return (
    <div
      className={`app-shell ${
        largeText ? "large-text" : ""
      } ${highContrast ? "high-contrast" : ""}`}
    >
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">K</div>
          <span>
            KEORA<span className="brand-dot">.</span>
          </span>
        </div>

        <p className="menu-label">MENU</p>

        <nav aria-label="Main navigation">
          {navigation.map((item, index) => (
            <button
              key={item}
              className={`nav-item ${
                activeTab === item ? "active" : ""
              }`}
              onClick={() => setActiveTab(item)}
              aria-current={
                activeTab === item ? "page" : undefined
              }
            >
              <span className="nav-icon">
                {["◈", "↗", "⇄", "▥"][index]}
              </span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <span>✦</span>
            <h3>We're here to help.</h3>
            <p>Your payments, made simpler.</p>
          </div>

          <div className="profile">
            <div className="avatar">K</div>
            <div>
              <strong>{user?.name || user?.full_name || "KEORA User"}</strong>
              <p>{user?.email || "Personal Account"}</p>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="welcome-label">
              YOUR FINANCIAL SPACE
            </p>

            <h1>
              {activeTab === "Overview"
                ? "Good afternoon."
                : activeTab}
            </h1>
          </div>

          <div className="top-actions">
            <button
              className="accessibility-btn"
              aria-label="Accessibility options"
              aria-expanded={showAccessibility}
              onClick={() =>
                setShowAccessibility((value) => !value)
              }
            >
              Aa
            </button>

            <button
              className="notification-btn"
              aria-label="Notifications"
            >
              ♧<span></span>
            </button>

            <button type="button" className="logout-btn" onClick={handleLogout}>Log out</button>
            <div className="top-avatar">{(user?.name || user?.full_name || "K").charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {isLoading && <p role="status" className="demo-note">Loading your transactions...</p>}
        {!isLoading && loadError && <p role="alert" className="payment-error">{loadError}</p>}

        {/* ACCESSIBILITY SETTINGS */}

        {showAccessibility && (
          <section
            className="accessibility-panel"
            aria-label="Accessibility settings"
          >
            <div>
              <h2>Make KEORA yours.</h2>
              <p>
                Choose how you want to experience your payments.
              </p>
            </div>

            <label>
              <input
                type="checkbox"
                checked={largeText}
                onChange={(event) =>
                  setLargeText(event.target.checked)
                }
              />
              Large text
            </label>

            <label>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(event) =>
                  setHighContrast(event.target.checked)
                }
              />
              High contrast
            </label>
          </section>
        )}

        {/* OVERVIEW */}

        {activeTab === "Overview" && (
          <>
            <section className="hero-grid">
              <div className="balance-card">
                <div className="balance-top">
                  <span>YOUR AVAILABLE BALANCE</span>

                  <button
                    onClick={() =>
                      setShowBalance((value) => !value)
                    }
                  >
                    {showBalance
                      ? "Hide balance ◉"
                      : "Show balance ◎"}
                  </button>
                </div>

                <h2>
                  {showBalance
                    ? money(balancePaise)
                    : "₹ ••••••"}
                </h2>

                <p>Demo account · Not real money</p>

                <div className="balance-footer">
                  <span>KEORA WALLET</span>
                  <span>•••• 2048</span>
                </div>
              </div>

              <div className="quick-card">
                <span className="section-eyebrow">
                  QUICK ACTIONS
                </span>

                <button
                  className="quick-action"
                  onClick={openPayment}
                >
                  <span className="action-icon purple">↗</span>

                  <span>
                    <strong>Send money</strong>
                    <small>Make a simulated payment</small>
                  </span>

                  <b>→</b>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setActiveTab("Transactions")}
                >
                  <span className="action-icon peach">↔</span>

                  <span>
                    <strong>Transactions</strong>
                    <small>View your activity</small>
                  </span>

                  <b>→</b>
                </button>
              </div>
            </section>

            {/* LIVE STATISTICS */}

            <section className="stats-grid">
              <div className="stat-card">
                <span>INCOME · COMPLETED</span>
                <h3>{money(analytics.income)}</h3>
                <p className="positive">
                  Calculated from transactions
                </p>
              </div>

              <div className="stat-card">
                <span>SPENDING · COMPLETED</span>
                <h3>{money(analytics.expenses)}</h3>
                <p className="neutral">
                  Pending payments excluded
                </p>
              </div>

              <div className="stat-card">
                <span>TRANSACTIONS</span>
                <h3>{transactions.length}</h3>
                <p className="neutral">
                  All recorded activity
                </p>
              </div>
            </section>

            <section className="transactions-section">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    YOUR ACTIVITY
                  </span>
                  <h2>Recent transactions</h2>
                </div>

                <button
                  onClick={() => setActiveTab("Transactions")}
                >
                  View all →
                </button>
              </div>

              <TransactionList
                transactions={transactions.slice(0, 4)}
                onSelect={setSelectedTransaction}
              />
            </section>
          </>
        )}

        {/* TRANSACTIONS */}

        {activeTab === "Transactions" && (
          <section className="transactions-section full-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  YOUR ACTIVITY
                </span>

                <h2>All transactions</h2>

                <p className="results-count">
                  Showing {filteredTransactions.length} of{" "}
                  {transactions.length} transactions
                </p>
              </div>

              <button
                className="download-btn"
                onClick={downloadStatement}
              >
                ↓ Download CSV
              </button>
            </div>

            {/* SEARCH AND FILTER */}

            <div className="transaction-tools">
              <label className="search-field">
                <span aria-hidden="true">⌕</span>

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search recipient, category or ID"
                  aria-label="Search transactions"
                />
              </label>

              <label className="filter-field">
                <span>Category</span>

                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                  aria-label="Filter by category"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All categories");
                }}
              >
                Clear
              </button>
            </div>

            {filteredTransactions.length > 0 ? (
              <TransactionList
                transactions={filteredTransactions}
                onSelect={setSelectedTransaction}
              />
            ) : (
              <div className="empty-state">
                <div>⌕</div>
                <h3>No transactions found</h3>
                <p>
                  Try another search term or category.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All categories");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* PAYMENTS */}

        {activeTab === "Payments" && (
          <section className="placeholder-card">
            <div className="placeholder-icon">⇄</div>

            <h2>Payments made simple.</h2>

            <p>
              Send simulated payments with clear confirmations
              and transparent transaction status.
            </p>

            <button
              className="primary-btn"
              onClick={openPayment}
            >
              Start a payment →
            </button>

            <p className="demo-note">
              KEORA is a simulation. No real money is transferred.
            </p>
          </section>
        )}

        {/* INSIGHTS */}

        {activeTab === "Insights" && (
          <section className="transactions-section full-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  YOUR MONEY, UNDERSTOOD
                </span>

                <h2>Spending insights</h2>

                <p className="results-count">
                  Based on completed demo transactions only
                </p>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <span>TOTAL INCOME</span>
                <h3 className="positive">
                  {money(analytics.income)}
                </h3>
              </div>

              <div className="analytics-card">
                <span>TOTAL SPENDING</span>
                <h3>{money(analytics.expenses)}</h3>
              </div>

              <div className="analytics-card">
                <span>NET FLOW</span>
                <h3
                  className={
                    analytics.income - analytics.expenses >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {money(
                    analytics.income - analytics.expenses
                  )}
                </h3>
              </div>
            </div>

            <div className="category-analytics">
              <h3>Spending by category</h3>

              {Object.entries(analytics.categoryTotals).length ===
              0 ? (
                <p className="demo-note">
                  Completed spending will appear here.
                </p>
              ) : (
                Object.entries(analytics.categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, total]) => (
                    <div className="category-row" key={category}>
                      <div className="category-row-top">
                        <strong>{category}</strong>
                        <span>{money(total)}</span>
                      </div>

                      <div
                        className="category-bar-track"
                        role="img"
                        aria-label={`${category}: ${money(total)} spent`}
                      >
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${
                              (total / largestCategoryAmount) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>

            <p className="demo-note">
              Insights are calculated from transactions retrieved from your authenticated KEORA account.
              All payments shown are simulations; no real money is transferred.
            </p>
          </section>
        )}

        <footer>
          <span>© 2026 KEORA</span>
          <span>Designed for everyone. Built with care.</span>
          <span>SIMULATION ONLY</span>
        </footer>
      </main>

      {/* PAYMENT MODAL */}

      {showPayment && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowPayment(false)}
        >
          <form
            className="payment-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={makePayment}
          >
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowPayment(false)}
              aria-label="Close payment form"
            >
              ×
            </button>

            <span className="section-eyebrow">
              KEORA PAYMENTS
            </span>

            <h2>Send money.</h2>

            <p>
              Try a simulated transaction. No real money is transferred.
            </p>

            <label htmlFor="recipient">
              Recipient name
            </label>

            <input
              id="recipient"
              value={recipient}
              onChange={(event) =>
                setRecipient(event.target.value)
              }
              placeholder="Enter recipient name"
              required
              maxLength={60}
              autoComplete="off"
            />

            <label htmlFor="amount">
              Amount (INR)
            </label>

            <input
              id="amount"
              type="number"
              min="0.01"
              max={(balancePaise / 100).toFixed(2)}
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              placeholder="₹ 0.00"
              required
            />

            {paymentError && (
              <p className="payment-error" role="alert">
                {paymentError}
              </p>
            )}

            <button
              className="primary-btn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : "Confirm simulated payment →"}
            </button>

            <p className="demo-note">
              Demo only · Never enter real bank or card details.
            </p>
          </form>
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL */}

      {selectedTransaction && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setSelectedTransaction(null)}
        >
          <section
            className="payment-modal transaction-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-btn"
              onClick={() => setSelectedTransaction(null)}
              aria-label="Close transaction details"
            >
              ×
            </button>

            <span className="section-eyebrow">
              TRANSACTION DETAILS
            </span>

            <h2 id="transaction-detail-title">
              {selectedTransaction.name}
            </h2>

            <h3
              className={`detail-amount ${
                selectedTransaction.amount > 0
                  ? "positive"
                  : ""
              }`}
            >
              {selectedTransaction.amount > 0 ? "+" : ""}
              {money(selectedTransaction.amount)}
            </h3>

            <div className="detail-list">
              <p>
                <span>Category</span>
                <strong>{selectedTransaction.category}</strong>
              </p>

              <p>
                <span>Date</span>
                <strong>{selectedTransaction.date}</strong>
              </p>

              <p>
                <span>Status</span>
                <strong>{selectedTransaction.status}</strong>
              </p>

              <p>
                <span>Transaction ID</span>
                <strong>{selectedTransaction.id}</strong>
              </p>
            </div>

            <p className="demo-note">
              This is a simulated transaction record.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

// REUSABLE TRANSACTION LIST

function TransactionList({ transactions, onSelect }) {
  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <button
          className="transaction-row transaction-row-button"
          key={transaction.id}
          type="button"
          onClick={() => onSelect(transaction)}
          aria-label={`View ${transaction.name} transaction details`}
        >
          <span className="transaction-symbol" aria-hidden="true">
            {transaction.amount > 0 ? "↓" : "↗"}
          </span>

          <span className="transaction-info">
            <strong>{transaction.name}</strong>
            <span>
              {transaction.category} · {transaction.date}
            </span>
          </span>

          <span className="transaction-value">
            <strong
              className={
                transaction.amount > 0 ? "positive" : ""
              }
            >
              {transaction.amount > 0 ? "+" : ""}
              {money(transaction.amount)}
            </strong>

            <span
              className={
                transaction.status === "Pending"
                  ? "pending"
                  : "completed"
              }
            >
              {transaction.status}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default App;
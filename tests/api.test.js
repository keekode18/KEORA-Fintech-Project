import { test } from "node:test";
import assert from "node:assert/strict";

const API = "http://localhost:5000";

test("KEORA API is running", async () => {
  const response = await fetch(`${API}/`);

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.service, "KEORA API");
  assert.equal(data.status, "healthy");
});

test("Database connection is healthy", async () => {
  const response = await fetch(`${API}/api/health`);

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.database, "connected");
});

// Authentication tests

import { randomUUID } from "node:crypto";

const testEmail = `test_${randomUUID()}@keora.com`;
const testPassword = "KeoraTest@123";
let authToken;

test("User registration works", async () => {
  const response = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      full_name: "KEORA Test User",
      email: testEmail,
      password: testPassword
    })
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.user.email, testEmail);
});

test("User login works", async () => {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.token);

  authToken = data.token;
});

test("Incorrect password is rejected", async () => {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: testEmail,
      password: "WrongPassword123"
    })
  });

  assert.equal(response.status, 401);
});

test("Unauthenticated balance request is rejected", async () => {
  const response = await fetch(`${API}/api/transactions/balance`);

  assert.equal(response.status, 401);
});

test("Payment is created successfully", async () => {
  const response = await fetch(`${API}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Idempotency-Key": `payment-${randomUUID()}`
    },
    body: JSON.stringify({
      recipient: "Test Store",
      category: "Shopping",
      amount: 100,
      transaction_type: "expense",
      status: "Completed",
      description: "Automated payment test"
    })
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.duplicate, false);
  assert.equal(data.transaction.recipient, "Test Store");
});

test("Balance decreases after payment", async () => {
  const response = await fetch(`${API}/api/transactions/balance`, {
    headers: {
      "Authorization": `Bearer ${authToken}`
    }
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.balancePaise, 99990000);
});

test("Duplicate payment is not processed twice", async () => {
  const key = `duplicate-${randomUUID()}`;

  const payment = {
    recipient: "Duplicate Test",
    category: "Shopping",
    amount: 50,
    transaction_type: "expense",
    status: "Completed",
    description: "Duplicate test"
  };

  const sendPayment = () =>
    fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "Idempotency-Key": key
      },
      body: JSON.stringify(payment)
    });

  const first = await sendPayment();
  const second = await sendPayment();

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);

  const data = await second.json();
  assert.equal(data.duplicate, true);
});

test("Different payment with same key is rejected", async () => {
  const key = `conflict-${randomUUID()}`;

  const sendPayment = (amount) =>
    fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "Idempotency-Key": key
      },
      body: JSON.stringify({
        recipient: "Key Test",
        category: "Shopping",
        amount,
        transaction_type: "expense",
        status: "Completed",
        description: "Idempotency conflict test"
      })
    });

  const first = await sendPayment(10);
  const second = await sendPayment(20);

  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
});

test("Insufficient balance is rejected", async () => {
  const response = await fetch(`${API}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Idempotency-Key": `insufficient-${randomUUID()}`
    },
    body: JSON.stringify({
      recipient: "Expensive Purchase",
      category: "Shopping",
      amount: 2000000,
      transaction_type: "expense",
      status: "Completed",
      description: "Insufficient balance test"
    })
  });

  assert.equal(response.status, 400);
});
import express from "express";
import pool from "./db.js";
import authenticateToken from "./middleware.js";

const router = express.Router();

// GET: Fetch logged-in user's balance
router.get("/balance", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT balance_paise
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json({
      balancePaise: Number(result.rows[0].balance_paise)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to fetch balance"
    });
  }
});


// POST: Create transaction and update balance atomically
router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      recipient,
      category,
      amount,
      transaction_type,
      status = "Completed",
      description = ""
    } = req.body;

    const userId = req.user.userId;
    const idempotencyKey = req.get("Idempotency-Key");

    // Validate idempotency key
    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 100
    ) {
      return res.status(400).json({
        error: "A valid Idempotency-Key header is required"
      });
    }

    // Validate recipient
    if (
      typeof recipient !== "string" ||
      !recipient.trim() ||
      recipient.trim().length > 60
    ) {
      return res.status(400).json({
        error: "Invalid recipient name"
      });
    }

    // Validate category
    const allowedCategories = [
      "Food & Drink",
      "Shopping",
      "Income",
      "Transfer",
      "Utilities"
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid transaction category"
      });
    }

    // Validate amount
    const numericAmount = Number(amount);
    const amountPaise = Math.round(numericAmount * 100);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !Number.isSafeInteger(amountPaise) ||
      Math.abs(numericAmount * 100 - amountPaise) > 0.000001
    ) {
      return res.status(400).json({
        error: "Enter a valid amount with up to two decimal places"
      });
    }

    // Validate transaction type
    if (!["income", "expense", "transfer"].includes(transaction_type)) {
      return res.status(400).json({
        error: "Invalid transaction type"
      });
    }

    // Validate status
    if (!["Pending", "Completed", "Failed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid transaction status"
      });
    }

    // Validate description
    if (
      typeof description !== "string" ||
      description.length > 500
    ) {
      return res.status(400).json({
        error: "Invalid transaction description"
      });
    }

    await client.query("BEGIN");

    // Lock this user's balance to prevent concurrent overspending
    const userResult = await client.query(
      `SELECT balance_paise
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "User not found"
      });
    }

    const currentBalance = Number(userResult.rows[0].balance_paise);

    // Check idempotency before changing the balance
    const existing = await client.query(
      `SELECT *
       FROM transactions
       WHERE user_id = $1 AND idempotency_key = $2`,
      [userId, idempotencyKey]
    );

    if (existing.rows.length > 0) {
      const previous = existing.rows[0];

      const sameRequest =
        previous.recipient === recipient.trim() &&
        previous.category === category &&
        Number(previous.amount) === numericAmount &&
        previous.transaction_type === transaction_type &&
        previous.status === status &&
        previous.description === description;

      await client.query("ROLLBACK");

      if (!sameRequest) {
        return res.status(409).json({
          error: "Idempotency key already used for a different transaction"
        });
      }

      return res.status(200).json({
        message: "Duplicate request detected. Existing transaction returned.",
        transaction: previous,
        balancePaise: currentBalance,
        duplicate: true
      });
    }

    // Calculate new balance
    let newBalance = currentBalance;

    if (status === "Completed") {
      if (transaction_type === "income") {
        newBalance += amountPaise;
      } else {
        if (amountPaise > currentBalance) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            error: "Insufficient demo balance"
          });
        }

        newBalance -= amountPaise;
      }
    }

    // Create transaction
    const result = await client.query(
      `INSERT INTO transactions
       (user_id, recipient, category, amount, transaction_type,
        status, description, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        recipient.trim(),
        category,
        numericAmount,
        transaction_type,
        status,
        description,
        idempotencyKey
      ]
    );

    // Update database balance
    if (status === "Completed") {
      await client.query(
        `UPDATE users
         SET balance_paise = $1
         WHERE id = $2`,
        [newBalance, userId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction: result.rows[0],
      balancePaise: newBalance,
      duplicate: false
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      error: "Unable to create transaction"
    });

  } finally {
    client.release();
  }
});


// GET: Only logged-in user's transactions
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to fetch transactions"
    });
  }
});


// GET: Only logged-in user's individual transaction
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM transactions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Transaction not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to fetch transaction"
    });
  }
});

export default router;
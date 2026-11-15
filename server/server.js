
import express from "express";
import cors from "cors";
import pool from "./db.js";
import transactionRoutes from "./transactions.js";
import authRoutes from "./auth.js";

const app = express();


app.use(cors());
app.use(express.json());
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    service: "KEORA API",
    status: "healthy",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "healthy",
      database: "connected",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 5000;



const server = app.listen(PORT, () => {
  console.log(`KEORA API running on http://localhost:${PORT}`);
});

server.on("close", () => {
  console.log("KEORA server closed");
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down KEORA API...");

  server.close(async () => {
    await pool.end();
    console.log("Database connections closed.");
    process.exit(0);
  });
});
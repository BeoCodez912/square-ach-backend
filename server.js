const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Health check route (plain text)
app.get("/", (req, res) => {
  res.send("✅ Square ACH Backend is running!");
});

// ✅ JSON status page
app.get("/status", (req, res) => {
  res.json({
    message: "✅ Square ACH backend is up",
    timestamp: new Date().toISOString(),
    status: "OK",
    environment: process.env.NODE_ENV || "development"
  });
});

// ✅ Payment endpoint
app.post("/pay", async (req, res) => {
  const { nonce, cashTag } = req.body;

  if (!nonce || !cashTag) {
    return res.status(400).json({ error: "Missing nonce or cashTag" });
  }

  try {
    const response = await axios.post(
      "https://connect.squareup.com/v2/payments",
      {
        idempotency_key: crypto.randomUUID(),
        source_id: nonce,
        amount_money: { amount: 1000, currency: "USD" },
        note: `ACH to ${cashTag}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Payment error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

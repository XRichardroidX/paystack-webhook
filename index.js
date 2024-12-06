// Load environment variables from .env file
require("dotenv").config();

// Import required libraries
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3001;

// Secret key for verifying Paystack signature (stored in .env)
const secret = process.env.SECRET_KEY;

// Use body-parser middleware to parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Webhook route to handle Paystack events
app.post("/webhook", (req, res) => {
  // Get the Paystack signature sent in headers
  const paystackSignature = req.headers["x-paystack-signature"];

  // Compute the HMAC hash from the body of the request and the secret key
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  // Compare the computed hash with the signature from Paystack
  if (hash === paystackSignature) {
    const event = req.body;

    // Check the event type (you can add more conditions as needed)
    if (event && event.event === "charge.success") {
      console.log("Payment was successful:", event.data);
      res.status(200).json({ message: "Payment successful" });
    } else if (event && event.event === "charge.failed") {
      console.log("Payment failed:", event.data);
      res.status(200).json({ message: "Payment failed" });
    } else {
      res.status(200).json({ message: "Event received but unhandled" });
    }
  } else {
    // Invalid signature
    console.log("Invalid signature");
    res.status(400).json({ error: "Invalid signature" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

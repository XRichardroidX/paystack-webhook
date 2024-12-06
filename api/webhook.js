// api/webhook.js
const crypto = require("crypto");

const secret = process.env.SECRET_KEY;

if (!secret) {
  console.error("SECRET_KEY is not set!");
  process.exit(1); // Exit if the secret key is not found
}

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const paystackSignature = req.headers["x-paystack-signature"];
    const requestBody = JSON.stringify(req.body);
    
    // Log the request body and signature for debugging
    console.log("Received Request Body:", requestBody);
    console.log("Received Signature:", paystackSignature);
    
    // Calculate the hash using the request body and secret key
    const hash = crypto
      .createHmac("sha512", secret)
      .update(requestBody)
      .digest("hex");

    // Log the calculated hash for debugging
    console.log("Calculated Hash:", hash);

    // Compare the hash with the signature from Paystack
    if (hash === paystackSignature) {
      const event = req.body;
      if (event && event.event === "charge.success") {
        console.log("Payment was successful:", event.data);
        return res.status(200).json({ message: "Payment successful" });
      } else if (event && event.event === "charge.failed") {
        console.log("Payment failed:", event.data);
        return res.status(200).json({ message: "Payment failed" });
      } else {
        return res.status(200).json({ message: "Event received but unhandled" });
      }
    } else {
      console.log("Invalid signature");
      return res.status(400).json({ error: "Invalid signature" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
};

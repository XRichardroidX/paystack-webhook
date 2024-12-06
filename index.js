// Importing required modules
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Paystack secret key (replace with your own secret key from Paystack dashboard)
const PAYSTACK_SECRET_KEY = 'sk_test_your_secret_key';

/**
 * Function to initialize a Paystack recurring payment plan.
 * This endpoint receives user details from the Flutter app and sends them to Paystack.
 */
app.post('/initialize-payment', async (req, res) => {
  try {
    // Extracting user details from the request body
    const { email, amount, cardDetails } = req.body;

    // Validate request body
    if (!email || !amount || !cardDetails) {
      return res.status(400).json({ error: 'Email, amount, and card details are required.' });
    }

    // Send payment initialization request to Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email, // User's email address
        amount: amount * 100, // Convert to kobo as Paystack works with the smallest currency unit
        metadata: {
          custom_fields: [{
            cardDetails: cardDetails, // Store card details (if needed securely; sensitive data should not be logged)
          }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Log and send success response
    console.log('Payment initialized successfully:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    // Log error for debugging
    console.error('Error initializing payment:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

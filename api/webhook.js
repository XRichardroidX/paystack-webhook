const crypto = require("crypto");
const sdk = require("node-appwrite");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Initialize environment variables
const PAYSTACK_SECRET = "sk_test_adc6b961459dce45a075312db615d2a38055518f";
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "671282e4003a91843ccf";
const APPWRITE_API_KEY =
  "standard_40fc3c2ca75df6ff025856bda923ffdbbc69ef205b4ef6d32a99c304bcbe1232ff9955dd929eb221b3954728da899c716407c870328fa3047c4ac742eabc49fd20639f0b2fca9d4b2345bd31e257639a7c98cd9f90786025b6d5f77416896dba7480a8c2ab3b79d40c5cb4986b838dfb16a2fdd6c8f52969bc6facca4a75a20b";
const APPWRITE_COLLECTION_ID = "671284bc002e050dc774";
const APPWRITE_DATABASE_ID = "671284a4000666441c08"; // Replace with your actual database ID if it's different

// Initialize Appwrite SDK
const client = new sdk.Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

// Initialize Appwrite Database service
const databases = new sdk.Databases(client);

// Webhook to handle Paystack events
module.exports = async (req, res) => {
  // Verify Paystack webhook signature
  const paystackSignature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash === paystackSignature) {
    const event = req.body;

    // Handle successful payment event
    if (event && event.event === "charge.success") {
      console.log("Payment was successful:", event.data);

      // Extract user email from the event
      const userEmail = event.data.customer.email;

      try {
        // Debug logs
        console.log("Using databaseId:", APPWRITE_DATABASE_ID);
        console.log("Using collectionId:", APPWRITE_COLLECTION_ID);
        console.log("Searching for email:", userEmail);

        // Query the database for the user document by email
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID, // Include the database ID
          APPWRITE_COLLECTION_ID, // Include the collection ID
          [sdk.Query.equal("email", [userEmail])] // Query by email
        );

        console.log("Response from listDocuments:", response);

        if (response.documents.length > 0) {
          const user = response.documents[0]; // Assume the first user document is the one we need
          console.log("Found user document:", user);

          // Get the current timestamp for startSub (current date and time)
          const startSub = new Date().toISOString();

          // Calculate the timestamp for the next subscription charge date (next month)
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const endSub = nextMonth.toISOString();

          // Update the user's startSub and endSub in the database
          await databases.updateDocument(
            APPWRITE_DATABASE_ID, // Include the database ID
            APPWRITE_COLLECTION_ID, // Include the collection ID
            user.$id, // Use the user document's ID
            {
              startSub: startSub, // Start subscription date
              endSub: endSub // End subscription date
            }
          );

          console.log(
            `User ${userEmail}'s subscription updated with startSub: ${startSub} and endSub: ${endSub}`
          );
          res.status(200).json({ message: "Subscription updated" });
        } else {
          console.log(`User with email ${userEmail} not found`);
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error updating subscription:", error);

        // Handle Appwrite errors
        if (error.response) {
          console.error("Error response from Appwrite:", error.response);
        }

        res.status(500).json({ error: "Internal Server Error" });
      }
    } else if (event && event.event === "charge.failed") {
      console.log("Payment failed:", event.data);
      res.status(200).json({ message: "Payment failed" });
    } else {
      console.log("Unhandled event:", event);
      res.status(200).json({ message: "Event received but unhandled" });
    }
  } else {
    console.log("Invalid signature");
    res.status(400).json({ error: "Invalid signature" });
  }
};

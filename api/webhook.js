const crypto = require("crypto");
const sdk = require("node-appwrite");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Initialize environment variables
const PAYSTACK_SECRET_TEST = "sk_test_adc6b961459dce45a075312db615d2a38055518f";
const PAYSTACK_SECRET = "sk_live_2cb5c0611da9addb24ee696a748c21788da71f09";
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "671282e4003a91843ccf";
const APPWRITE_API_KEY = "your_appwrite_api_key";
const APPWRITE_COLLECTION_ID = "671284bc002e050dc774";
const APPWRITE_DATABASE_ID = "671284a4000666441c08";

// Initialize Appwrite SDK
const client = new sdk.Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

// Initialize Appwrite Database service
const databases = new sdk.Databases(client);

// Function to generate a timestamp
const generateTimestamp = (date = new Date()) => {
  const microseconds = (date.getMilliseconds() * 1000)
    .toString()
    .padStart(6, "0");
  const isoDate = date.toISOString();
  return `${isoDate.substring(0, 19)}.${microseconds}`;
};

// Function to calculate subscription end date based on plan name
const calculateEndSub = (planName) => {
  const endDate = new Date();
  if (planName?.toLowerCase().includes("monthly")) {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planName?.toLowerCase().includes("yearly")) {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  return generateTimestamp(endDate);
};

// Webhook to handle Paystack events
module.exports = async (req, res) => {
  const paystackSignature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== paystackSignature) {
    console.log("Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;

  const updateSubscriptionHistory = async (email, eventData) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [email])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];

        // Fetch current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new entry
        const newEntry = JSON.stringify(eventData, null, 2);

        // Update the subscription history
        const updatedHistory = currentHistory
          ? `${currentHistory}\n\n,\n\n${newEntry}`
          : newEntry;

        // Update user document
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          user.$id,
          { subscriptionHistory: updatedHistory }
        );

        console.log(`Subscription history updated for ${email}`);
      } else {
        console.log(`User with email ${email} not found`);
      }
    } catch (error) {
      console.error("Error updating subscription history:", error);
    }
  };

  switch (event?.event) {
    case "charge.success":
      console.log("Payment was successful:", event.data);

      const { email } = event.data.customer;
      const planName = event.data.plan?.name || "monthly"; // Default to "monthly" if undefined

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          [sdk.Query.equal("email", [email])]
        );

        if (response.documents.length > 0) {
          const user = response.documents[0];
          const startSub = generateTimestamp();
          const endSub = calculateEndSub(planName);

          // Update subscription details
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            user.$id,
            { startSub, endSub }
          );

          // Update subscription history
          await updateSubscriptionHistory(email, event.data);

          console.log(`Subscription updated for ${email}`);
          res.status(200).json({ message: "Subscription updated" });
        } else {
          console.log(`User with email ${email} not found`);
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
      break;

    case "subscription.disable":
    case "invoice.payment_failed":
    case "subscription.expiring_cards":
    case "subscription.not_renew":
      console.log(`Subscription event received: ${event.event}`);
      await updateSubscriptionHistory(event.data.customer.email, event.data);
      res.status(200).json({ message: "Subscription history updated" });
      break;

    default:
      console.log("Unhandled event:", event.event);
      res.status(200).json({ message: "Unhandled event" });
      break;
  }
};

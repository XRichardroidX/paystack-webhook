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
const APPWRITE_DATABASE_ID = "671284a4000666441c08";

// Initialize Appwrite SDK
const client = new sdk.Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

// Initialize Appwrite Database service
const databases = new sdk.Databases(client);

// Function to generate a timestamp in the required format
const generateTimestamp = (date = new Date()) => {
  const microseconds = (date.getMilliseconds() * 1000)
    .toString()
    .padStart(6, "0");
  const isoDate = date.toISOString();
  return `${isoDate.substring(0, 19)}.${microseconds}`;
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

  const handleEvent = async (eventType, data) => {
    console.log(`Event: ${eventType}`, data);
    res.status(200).json({ message: `${eventType} event received` });
  };

  switch (event?.event) {
    case "charge.success":
      console.log("Payment was successful:", event.data);
      const userEmail = event.data.customer.email;

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          [sdk.Query.equal("email", [userEmail])]
        );

        if (response.documents.length > 0) {
          const user = response.documents[0];
          const startSub = generateTimestamp();
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const endSub = generateTimestamp(nextMonth);

          // Fetch the current subscription history
          const currentHistory = user.subscriptionHistory || "";

          // Format the new history entry
          const newEntry = JSON.stringify(event.data, null, 2);

          // Prepare the updated subscription history
          const updatedHistory = currentHistory
            ? `${currentHistory}\n\n,\n\n${newEntry}`
            : newEntry;

          // Update user document
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            user.$id,
            { startSub, endSub, subscriptionHistory: updatedHistory }
          );

          console.log(`Subscription updated for ${userEmail}`);
          res.status(200).json({ message: "Subscription updated" });
        } else {
          console.log(`User with email ${userEmail} not found`);
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
      break;

    case "charge.dispute.create":
    case "charge.dispute.remind":
    case "charge.dispute.resolve":
    case "customeridentification.failed":
    case "customeridentification.success":
    case "dedicatedaccount.assign.failed":
    case "dedicatedaccount.assign.success":
    case "invoice.create":
    case "invoice.payment_failed":
    case "invoice.update":
    case "paymentrequest.pending":
    case "paymentrequest.success":
    case "refund.failed":
    case "refund.pending":
    case "refund.processed":
    case "refund.processing":
    case "subscription.create":

    console.log("Payment was successful:", event.data);

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          [sdk.Query.equal("email", [userEmail])]
        );

        if (response.documents.length > 0) {
          const user = response.documents[0];
         
          // Fetch the current subscription history
          const currentHistory = user.subscriptionHistory || "";

          // Format the new history entry
          const newEntry = JSON.stringify(event.data, null, 2);

          // Prepare the updated subscription history
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

          console.log(`Subscription updated for ${userEmail}`);
          res.status(200).json({ message: "Subscription updated" });
        } else {
          console.log(`User with email ${userEmail} not found`);
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
      break;

    case "subscription.disable":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    break;


    case "subscription.expiring_cards":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    break;


    case "subscription.not_renew":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    break;


    case "transfer.failed":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    break;


    case "transfer.success":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    break;


    case "transfer.reversed":

    console.log("Payment was successful:", event.data);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        [sdk.Query.equal("email", [userEmail])]
      );

      if (response.documents.length > 0) {
        const user = response.documents[0];
       
        // Fetch the current subscription history
        const currentHistory = user.subscriptionHistory || "";

        // Format the new history entry
        const newEntry = JSON.stringify(event.data, null, 2);

        // Prepare the updated subscription history
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

        console.log(`Subscription updated for ${userEmail}`);
        res.status(200).json({ message: "Subscription updated" });
      } else {
        console.log(`User with email ${userEmail} not found`);
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }


      await handleEvent(event.event, event.data);
      break;

    default:
      console.log("Unhandled event:", event);
      res.status(200).json({ message: "Unhandled event" });
      break;
  }
};


// pages/api/waafi/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// Placeholder for Waafi's callback verification logic (e.g., signature check)
// You MUST implement proper verification based on Waafi's documentation.
const verifyWaafiCallback = (req: NextApiRequest): boolean => {
  // Example: Check for a specific header or a signature
  // const waafiSignature = req.headers['x-waafi-signature'];
  // const expectedSignature = crypto.createHmac('sha256', process.env.WAAFI_WEBHOOK_SECRET)
  //                             .update(JSON.stringify(req.body))
  //                             .digest('hex');
  // if (waafiSignature !== expectedSignature) {
  //   console.error("Waafi callback signature mismatch.");
  //   return false;
  // }
  console.log("Waafi callback received. TODO: Implement proper verification.");
  return true; // For now, assume it's valid. REPLACE WITH ACTUAL VERIFICATION.
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log("Waafi Callback Received - Body:", req.body);
  console.log("Waafi Callback Received - Headers:", req.headers);


  if (!verifyWaafiCallback(req)) {
    return res.status(403).json({ success: false, message: "Callback verification failed." });
  }

  try {
    // Adapt this based on the actual payload structure from Waafi
    const {
      // Example fields from a hypothetical Waafi callback payload
      status, // e.g., "SUCCESS", "FAILED"
      transactionId, // This should be the referenceId we sent
      amountPaid, // Amount paid in the target currency (e.g., SOS)
      currency,   // Currency of amountPaid (e.g., "SOS")
      msisdn,     // Payer's phone number
      customReference // The JSON stringified metadata we sent
    } = req.body;

    if (!customReference) {
        console.error("Waafi callback missing 'customReference' (our metadata).");
        return res.status(400).json({ success: false, message: "Callback data incomplete (missing customReference)." });
    }
    
    let internalMetadata;
    try {
        internalMetadata = JSON.parse(customReference);
    } catch (parseError) {
        console.error("Error parsing customReference from Waafi callback:", parseError, "Raw customReference:", customReference);
        return res.status(400).json({ success: false, message: "Invalid customReference format." });
    }


    const { userId, coins, originalAmountKES, packageName, internalTxId } = internalMetadata;

    if (!userId || !coins || !internalTxId) {
      console.error("Waafi callback missing critical metadata: userId, coins, or internalTxId.");
      return res.status(400).json({ success: false, message: "Callback metadata incomplete." });
    }

    if (transactionId !== internalTxId) {
        console.warn(`Waafi callback transactionId (${transactionId}) does not match internalTxId (${internalTxId}). Proceeding, but investigate.`);
    }


    if (status && status.toUpperCase() === 'SUCCESS') { // Adapt 'SUCCESS' to Waafi's actual success status string
      const userRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userRef);

      const paymentRecord = {
        method: 'waafi',
        amount: originalAmountKES, // Log KES amount for consistency
        coins: coins,
        timestamp: serverTimestamp(),
        reference: internalTxId, // Our internal transaction ID
        waafiTransactionId: req.body.waafiTransactionId || transactionId, // Waafi's specific ID from their payload
        status: 'success',
        packageName: packageName,
        currency: "KES", // Record payment in KES
        gatewayResponseSummary: { // Store some raw Waafi data for reference
            waafiStatus: status,
            waafiAmountPaid: amountPaid,
            waafiCurrency: currency,
            waafiMsisdn: msisdn,
        }
      };

      if (userDocSnap.exists()) {
        const currentCoins = userDocSnap.data().coins || 0;
        await updateDoc(userRef, {
          coins: currentCoins + coins,
          paymentHistory: arrayUnion(paymentRecord),
          updatedAt: serverTimestamp(),
        });
      } else {
        // This case should ideally not happen if user is created on signup
        // But handle it defensively
        console.warn(`User document for ${userId} not found. Creating one for Waafi payment.`);
        await setDoc(userRef, {
          // Set default fields for a new user
          email: `waafi_user_${userId}@example.com`, // Placeholder, ideally get from auth
          name: `Waafi User ${userId}`,
          photoURL: null,
          firstName: '',
          lastName: '',
          country: '',
          mobile: msisdn || '', // Use Waafi phone number if available
          profileComplete: false,
          preferredCategories: [],
          isAdmin: false,
          coins: coins,
          paymentHistory: arrayUnion(paymentRecord),
          freeContentConsumedCount: 0,
          consumedContentIds: [],
          likedContentIds: [],
          savedContentIds: [],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      console.log(`Waafi payment successful for user ${userId}. ${coins} coins added.`);
      return res.status(200).json({ success: true, message: "Payment processed successfully." });
    } else {
      console.log(`Waafi payment not successful or status unknown for user ${userId}. Status: ${status}`);
      // Optionally log failed or pending transactions
      // Example: Log to a 'failed_transactions' collection or update a transaction record
      return res.status(200).json({ success: false, message: `Payment status: ${status}` });
    }
  } catch (error: any) {
    console.error('Error processing Waafi callback:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error processing Waafi callback.' });
  }
}

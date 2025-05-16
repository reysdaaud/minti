
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Fictional endpoint
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:9002';

interface WaafiInitiateRequestBody {
  amount: number; // Original KES amount from package
  currency: string; // Target currency for Waafi (e.g., SOS)
  phoneNumber: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    originalAmountKES: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!WAAFI_API_KEY || !WAAFI_MERCHANT_ID) {
    console.error("Waafi API Key or Merchant ID is not configured.");
    return res.status(500).json({ success: false, message: "Payment gateway configuration error." });
  }

  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata) {
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  // TODO: Implement actual KES to target currency (e.g., SOS) conversion if Waafi needs it
  // For now, assuming Waafi can take KES and do conversion, or you send the target currency amount
  const waafiAmount = amount; // Placeholder: Use actual converted amount if Waafi needs SOS
  const waafiCurrency = currency; // e.g., "SOS"

  const transactionId = `WAAFI_${userId}_${Date.now()}`; // Unique transaction ID

  // Construct the callback URL
  const callbackUrl = `${NEXT_PUBLIC_APP_BASE_URL}/api/waafi/callback`;

  const waafiPayload = {
    schemaVersion: '1.0', // Example field
    requestId: transactionId,
    timestamp: new Date().toISOString(),
    channelName: 'WEB', // Example field
    serviceName: 'API_PURCHASE', // Example field
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_KEY, // Or however Waafi auth works
      paymentMethod: 'MWALLET_ACCOUNT', // Example
      payerInfo: {
        msisdn: phoneNumber,
      },
      transactionInfo: {
        referenceId: transactionId,
        invoiceId: transactionId, // Can be same as referenceId or different
        amount: waafiAmount, // Amount in target currency (e.g., SOS)
        currency: waafiCurrency, // e.g., "SOS"
        description: `Purchase of ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        notifyUrl: callbackUrl, // Waafi will POST to this URL
      },
      // Pass our internal metadata through Waafi if possible
      // This helps reconcile the transaction in the callback
      customReference: JSON.stringify({
        userId,
        coins: metadata.coins,
        originalAmountKES: metadata.originalAmountKES,
        packageName: metadata.packageName,
        internalTxId: transactionId
      }), // Or whatever field Waafi allows for custom data
    },
  };

  try {
    // ***** THIS IS A MOCK API CALL - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    console.log("Initiating Waafi payment with payload:", JSON.stringify(waafiPayload, null, 2));
    // const waafiResponse = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add Waafi specific auth headers, e.g., 'Authorization': `Bearer ${WAAFI_API_KEY}`
    //   },
    //   body: JSON.stringify(waafiPayload),
    // });

    // const waafiResult = await waafiResponse.json();

    // if (!waafiResponse.ok || waafiResult.responseCode !== '2001') { // Example success code
    //   console.error('Waafi API Error:', waafiResult);
    //   throw new Error(waafiResult.responseMsg || 'Failed to initiate payment with Waafi.');
    // }
    // ***** END OF MOCK API CALL *****

    // Simulate a successful initiation for now
    const mockWaafiResult = {
      responseCode: "2001",
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      // Waafi might return its own transaction ID or reference here
      waafiTransactionId: "WFP_MOCK_" + Date.now()
    };
    // **************************************************************************

    // Log the pending transaction in your system if needed
    // For example, in a 'transactions' collection with a 'pending' status

    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      // Pass any relevant info back to client, e.g., Waafi's transaction ID
      transactionReference: transactionId, // Our internal ID
      waafiReference: mockWaafiResult.waafiTransactionId // Waafi's ID
    });

  } catch (error: any) {
    console.error('Error initiating Waafi payment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation.' });
  }
}

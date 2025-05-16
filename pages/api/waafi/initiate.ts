
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Fictional endpoint - REPLACE WITH ACTUAL WAAFI ENDPOINT
const NEXT_PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://minti-c6ls.vercel.app';

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
    console.error("Waafi API Key or Merchant ID is not configured in environment variables (WAAFI_API_KEY, WAAFI_MERCHANT_ID).");
    return res.status(500).json({ success: false, message: "Payment gateway configuration error. [WCFG01]" });
  }

  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata || !metadata.originalAmountKES) {
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  // TODO: Implement actual KES to target currency (e.g., SOS) conversion if Waafi needs it
  // For now, assuming Waafi can take KES and do conversion, or you send the target currency amount
  const waafiAmount = amount; // Placeholder: Use actual converted amount if Waafi needs SOS
  const waafiCurrency = currency; // e.g., "SOS"

  const transactionId = `WAAFI_${userId}_${Date.now()}`; // Unique transaction ID

  // Construct the callback URL
  const callbackUrl = `${NEXT_PUBLIC_APP_BASE_URL}/api/waafi/callback`;

  // This payload is an EXAMPLE. You MUST replace it with the actual payload required by Waafi's API.
  const waafiPayload = {
    schemaVersion: '1.0', // Example field from Waafi docs if available
    requestId: transactionId, // Example field
    timestamp: new Date().toISOString(), // Example field
    channelName: 'WEB', // Example field
    serviceName: 'API_PURCHASE', // Example field for "MOBILE_CHECKOUT_INIT" or similar
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_KEY, // Or however Waafi auth works, e.g. using an API secret in headers
      paymentMethod: 'MWALLET_ACCOUNT', // Example: 'MOBILE_MONEY', 'EDAHAB', 'ZAAD', 'SAHAL' etc.
      payerInfo: {
        msisdn: phoneNumber, // Customer's phone number for Waafi
      },
      transactionInfo: {
        referenceId: transactionId, // Your internal reference ID
        invoiceId: `INV_${transactionId}`, // Can be same as referenceId or different
        amount: waafiAmount.toString(), // Amount in target currency (e.g., SOS), ensure it's a string if Waafi expects that
        currency: waafiCurrency, // e.g., "SOS"
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        notifyUrl: callbackUrl, // Waafi will POST to this URL after payment attempt
      },
      // Pass our internal metadata through Waafi if possible
      // This helps reconcile the transaction in the callback. Check Waafi docs for their field name.
      customParameters: { // Or 'params', 'metaData', 'merchantDefinedFields' etc.
        userId,
        coins: metadata.coins,
        originalAmountKES: metadata.originalAmountKES,
        packageName: metadata.packageName,
        internalTxId: transactionId
      },
    },
  };

  try {
    // ***** THIS IS A MOCK API CALL - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    console.log("Initiating Waafi payment with payload:", JSON.stringify(waafiPayload, null, 2));
    console.log("Target Waafi API Endpoint:", WAAFI_API_ENDPOINT_INITIATE);
    console.log("Callback URL sent to Waafi:", callbackUrl);
    
    // Example of what a real fetch might look like:
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add Waafi specific auth headers, e.g.,
    //     // 'Authorization': `Bearer YOUR_WAAFI_ACCESS_TOKEN`,
    //     // 'X-API-KEY': WAAFI_API_KEY, (if it's a header key)
    //   },
    //   body: JSON.stringify(waafiPayload),
    // });

    // const waafiResult = await response.json();

    // if (!response.ok || waafiResult.responseCode !== '2001') { // '2001' is just an EXAMPLE success code
    //   console.error('Waafi API Error:', waafiResult);
    //   throw new Error(waafiResult.responseMsg || 'Failed to initiate payment with Waafi. [WAPI_INIT_ERR]');
    // }
    // ***** END OF MOCK API CALL *****

    // Simulate a successful initiation for now for development purposes
    const mockWaafiResult = {
      responseCode: "2001", // Replace with actual Waafi success code
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      // Waafi might return its own transaction ID or reference here
      waafiTransactionId: "WFP_MOCK_" + Date.now(),
      // It might return a redirect URL for some flows, or just a confirmation
      // paymentUrl: "https://waafi.com/pay/SOME_ID" (if applicable)
    };
    // **************************************************************************

    // Log the pending transaction in your system if needed
    // For example, in a 'transactions' collection with a 'pending' status

    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      // Pass any relevant info back to client, e.g., Waafi's transaction ID
      transactionReference: transactionId, // Our internal ID
      waafiReference: mockWaafiResult.waafiTransactionId, // Waafi's ID (if provided by initiation API)
      // paymentUrl: mockWaafiResult.paymentUrl (if Waafi provides a redirect URL for user)
    });

  } catch (error: any) {
    console.error('Error initiating Waafi payment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}

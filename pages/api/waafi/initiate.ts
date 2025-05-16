
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
// THIS IS A FICTIONAL ENDPOINT - REPLACE WITH ACTUAL WAAFI DOCUMENTATION
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; 

// Determine the base URL for callbacks. Prioritize environment variable.
const getAppBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  }
  // Fallback for Vercel system environment variables if NEXT_PUBLIC_APP_BASE_URL is not set
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development or if VERCEL_URL is not available (e.g. local `npm run dev`)
  // Ensure this matches your live Vercel URL if NEXT_PUBLIC_APP_BASE_URL is not set in Vercel.
  return process.env.NODE_ENV === 'production' ? 'https://minti-c6ls.vercel.app/' : 'http://localhost:9002';
};


interface WaafiInitiateRequestBody {
  amount: number; // Original KES amount from package
  currency: string; // Target currency for Waafi (e.g., "USD")
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
  
  // The 'amount' received here is the KES value from the package.
  // If Waafi expects this 'amount' to be in USD, then a conversion from KES to USD is needed here.
  // For now, we are passing the numerical value of KES as 'waafiAmount' and labeling it with 'waafiCurrency' (USD).
  // TODO: Implement actual KES to USD conversion here if Waafi's API requires the amount to be in USD.
  const waafiAmount = amount; // This is the KES numerical value. If Waafi expects USD, convert this.
  const waafiCurrency = currency.toUpperCase(); // Should be "USD" based on your last request.

  const transactionId = `WAAFI_${userId}_${Date.now()}`; // Unique transaction ID

  const appBaseUrl = getAppBaseUrl();
  const callbackUrl = `${appBaseUrl}/api/waafi/callback`;

  // This payload is an EXAMPLE. You MUST replace it with the actual payload required by Waafi's API.
  // Consult Waafi documentation for the correct field names and values.
  const waafiPayload = {
    schemaVersion: '1.0', // Example field
    requestId: transactionId, // Example field
    timestamp: new Date().toISOString(), // Example field
    channelName: 'WEB', // Example field
    serviceName: 'API_PURCHASE', // Example: 'MOBILE_CHECKOUT_INIT' or similar name from Waafi docs
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_KEY, 
      // paymentMethod: 'MWALLET_ACCOUNT', // ** CRITICAL FIELD **
      // Replace 'MWALLET_ACCOUNT' with the specific code Waafi uses for EVC, ZAAD, SAHAL, etc.
      // e.g., "EVCPLUS", "ZAAD_SERVICE", "SAHAL_PAY", "WAAFI_WALLET".
      // This might come from the client if you allow users to select.
      // For now, you might hardcode one or need to adjust based on Waafi docs.
      // Example:
      paymentMethod: "EVCPLUS", // Or "ZAAD_SERVICE", "SAHAL", etc. - CHECK WAAFI DOCS
      payerInfo: {
        msisdn: phoneNumber, 
      },
      transactionInfo: {
        referenceId: transactionId, 
        invoiceId: `INV_${transactionId}`, 
        amount: waafiAmount.toString(), 
        currency: waafiCurrency, 
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        notifyUrl: callbackUrl, 
      },
      customParameters: { // Or 'params', 'metaData', 'merchantDefinedFields' etc., as per Waafi docs
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
    
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add Waafi specific auth headers, e.g.,
    //     // 'Authorization': `Bearer YOUR_WAAFI_ACCESS_TOKEN`,
    //     // 'X-API-KEY': WAAFI_API_KEY, 
    //     // 'X-App-Secret': process.env.WAAFI_API_SECRET 
    //   },
    //   body: JSON.stringify(waafiPayload),
    // });

    // const waafiResult = await response.json();

    // if (!response.ok || waafiResult.responseCode !== '2001') { // '2001' is just an EXAMPLE success code from Waafi
    //   console.error('Waafi API Error:', waafiResult);
    //   throw new Error(waafiResult.responseMsg || 'Failed to initiate payment with Waafi. [WAPI_INIT_ERR]');
    // }
    // ***** END OF MOCK API CALL *****

    // Simulate a successful initiation for now for development purposes
    const mockWaafiResult = {
      responseCode: "2001", // Replace with actual Waafi success code
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      waafiTransactionId: "WFP_MOCK_" + Date.now(),
      // redirectUrl: "https://checkout.waafipay.com/..." // If Waafi provides a redirect URL
    };
    // **************************************************************************

    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      transactionReference: transactionId,
      waafiReference: mockWaafiResult.waafiTransactionId,
      // redirectUrl: mockWaafiResult.redirectUrl // Send this back if Waafi provides one
    });

  } catch (error: any) {
    console.error('Error initiating Waafi payment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}

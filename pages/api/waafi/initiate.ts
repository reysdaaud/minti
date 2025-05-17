
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
// THIS IS A FICTIONAL ENDPOINT - REPLACE WITH ACTUAL WAAFI DOCUMENTATION
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Example, replace with actual

// Determine the base URL for callbacks. Prioritize environment variable.
const getAppBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  }
  if (process.env.VERCEL_URL) { // Vercel system environment variable
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development (ensure this matches your local Next.js port)
  return process.env.NODE_ENV === 'production' 
    ? 'https://minti-c6ls.vercel.app' // Your production URL as fallback
    : 'http://localhost:9002'; // Your local dev port (adjust if different)
};

interface WaafiInitiateRequestBody {
  amount: number; 
  currency: string; // Should be "USD"
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
  console.log("Attempting to handle request for /api/waafi/initiate"); // New Log

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.log("/api/waafi/initiate - Method Not Allowed:", req.method);
    return res.status(405).end('Method Not Allowed');
  }

  console.log("/api/waafi/initiate - Received POST request. Body:", req.body); // New Log

  if (!WAAFI_API_KEY || !WAAFI_MERCHANT_ID) {
    console.error("Waafi API Key or Merchant ID is not configured in environment variables (WAAFI_API_KEY, WAAFI_MERCHANT_ID).");
    return res.status(500).json({ success: false, message: "Payment gateway configuration error. [WCFG01]" });
  }

  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata || typeof metadata.originalAmountKES === 'undefined') {
    console.error("/api/waafi/initiate - Missing required payment details:", req.body);
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }
  
  // Amount is KES value. Currency is "USD".
  // If Waafi requires 'amount' to be in USD value, conversion is needed here.
  const waafiAmount = amount; 
  const waafiCurrency = currency.toUpperCase(); // Should be "USD"

  const transactionId = `WAAFI_${userId}_${Date.now()}`; 

  const appBaseUrl = getAppBaseUrl();
  const callbackUrl = `${appBaseUrl}/api/waafi/callback`;

  const waafiPayload = {
    schemaVersion: '1.0', 
    requestId: transactionId, 
    timestamp: new Date().toISOString(), 
    channelName: 'WEB', 
    serviceName: 'API_PURCHASE', 
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_KEY, 
      paymentMethod: "MOBILE_MONEY", // Placeholder - REPLACE WITH ACTUAL WAAFI METHOD CODE (e.g., EVCPLUS, ZAAD_SERVICE)
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
      customParameters: { 
        userId,
        coins: metadata.coins,
        originalAmountKES: metadata.originalAmountKES,
        packageName: metadata.packageName,
        internalTxId: transactionId
      },
    },
  };

  try {
    console.log("Initiating Waafi payment with MOCK payload:", JSON.stringify(waafiPayload, null, 2));
    // ***** THIS IS A MOCK API CALL SECTION - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', /* ... Waafi Auth Headers ... */ },
    //   body: JSON.stringify(waafiPayload),
    // });
    // if (!response.ok) { 
    //    const errorText = await response.text();
    //    throw new Error(`Waafi API error: ${response.status} - ${errorText}`);
    // }
    // const waafiResult = await response.json();
    // if (!waafiResult.success_flag_or_equivalent_field) { // Adapt success check
    //   console.error('Waafi API Error:', waafiResult);
    //   throw new Error(waafiResult.response_message_or_equivalent || 'Failed to initiate payment with Waafi. [WAPI_INIT_ERR]');
    // }

    // Simulate a successful initiation for now - REMOVE FOR PRODUCTION
    const mockWaafiResult = {
      responseCode: "2001", // Replace with actual Waafi success code from their docs
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      waafiTransactionId: "WFP_MOCK_" + Date.now(),
    };
    // **************************************************************************

    console.log("Mock Waafi initiation successful on server:", mockWaafiResult);
    return res.status(200).json({
      success: true, 
      message: mockWaafiResult.responseMsg,
      transactionReference: transactionId, 
      waafiReference: mockWaafiResult.waafiTransactionId,
    });

  } catch (error: any) {
    console.error('Error in /api/waafi/initiate catch block:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}

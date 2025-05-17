
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
// THIS IS A FICTIONAL ENDPOINT - REPLACE WITH ACTUAL WAAFI DOCUMENTATION
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Example, replace with actual

// Determine the base URL for callbacks.
const getAppBaseUrl = (req: NextApiRequest) => {
  // 1. Try NEXT_PUBLIC_APP_BASE_URL (recommended for production)
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  }
  // 2. Try VERCEL_URL (if deployed on Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 3. Fallback for local development using request headers
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:9002'; // Default to 9002 if host is not found
  return `${protocol}://${host}`;
};

interface WaafiInitiateRequestBody {
  amount: number;
  currency: string; // Should be "USD" as per your last instruction
  phoneNumber: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    originalAmountKES: number; // Original KES amount for reference
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[API /api/waafi/initiate] Received request. Method:", req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.log("[API /api/waafi/initiate] Method Not Allowed:", req.method);
    return res.status(405).end('Method Not Allowed');
  }

  console.log("[API /api/waafi/initiate] Request Body:", req.body);

  if (!WAAFI_API_KEY || !WAAFI_MERCHANT_ID) {
    console.error("[API /api/waafi/initiate] Waafi API Key or Merchant ID is not configured in environment variables (WAAFI_API_KEY, WAAFI_MERCHANT_ID).");
    return res.status(500).json({ success: false, message: "Payment gateway configuration error. [WCFG01]" });
  }

  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata || typeof metadata.originalAmountKES === 'undefined') {
    console.error("[API /api/waafi/initiate] Missing required payment details:", req.body);
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  // The `amount` here is the numerical value from KES package.
  // If Waafi requires this amount to be a USD value, conversion logic would be needed here.
  // For now, we pass the KES numerical value with "USD" currency code.
  const waafiAmount = amount;
  const waafiCurrency = currency.toUpperCase(); // Expected to be "USD"

  const transactionId = `WAAFI_${userId}_${Date.now()}`;
  const appBaseUrl = getAppBaseUrl(req);
  const callbackUrl = `${appBaseUrl}/api/waafi/callback`;

  console.log(`[API /api/waafi/initiate] App Base URL: ${appBaseUrl}, Callback URL: ${callbackUrl}`);

  // Consult Waafi Documentation for the correct payload structure for a push STK payment.
  // The `paymentMethod` might need specific codes for EVC, ZAAD, Sahal, etc.
  // Example: "EVCPLUS", "ZAAD_SERVICE", "SAHAL_SOMTEL", "WAAFI_WALLET"
  // This example uses a generic "MOBILE_MONEY" placeholder.
  const waafiPaymentMethod = "EVCPLUS"; // <<<<< CONSULT WAAFI DOCS AND REPLACE THIS

  const waafiPayload = {
    schemaVersion: '1.0', // Or whatever version Waafi API uses
    requestId: transactionId,
    timestamp: new Date().toISOString(),
    channelName: 'WEB', // Or as specified by Waafi for API payments
    serviceName: 'API_PURCHASE', // Or specific service name from Waafi for this type of transaction
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_KEY,
      paymentMethod: waafiPaymentMethod,
      payerInfo: {
        msisdn: phoneNumber,
      },
      transactionInfo: {
        referenceId: transactionId,
        invoiceId: `INV_${transactionId}`,
        amount: waafiAmount.toString(), // Waafi might expect amount as string
        currency: waafiCurrency, // Should be "USD"
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        notifyUrl: callbackUrl,
      },
      customParameters: { // Sending our internal metadata to Waafi
        userId,
        coins: metadata.coins,
        originalAmountKES: metadata.originalAmountKES,
        packageName: metadata.packageName,
        internalTxId: transactionId
      },
    },
  };

  try {
    console.log("[API /api/waafi/initiate] Initiating Waafi payment with MOCK payload (actual API call is commented out):", JSON.stringify(waafiPayload, null, 2));

    // ***** THIS IS A MOCK API CALL SECTION - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // ... Add any other Waafi-specific Auth Headers (e.g., 'Authorization': `Bearer ${WAAFI_API_KEY}`) ...
    //   },
    //   body: JSON.stringify(waafiPayload),
    // });

    // const contentType = response.headers.get('content-type');
    // if (!response.ok || !contentType || !contentType.includes('application/json')) {
    //    const errorText = await response.text();
    //    console.error('[API /api/waafi/initiate] Waafi API error - Non-JSON response:', errorText, 'Status:', response.status);
    //    throw new Error(`Waafi API error: ${response.status} - ${errorText.substring(0, 100)}`);
    // }
    // const waafiResult = await response.json();

    // if (!waafiResult.success_flag_or_equivalent_field) { // Adapt success check based on Waafi's response
    //   console.error('[API /api/waafi/initiate] Waafi API Error Response:', waafiResult);
    //   throw new Error(waafiResult.response_message_or_equivalent || 'Failed to initiate payment with Waafi. [WAPI_INIT_ERR]');
    // }
    // ****************************************************************************************

    // Simulate a successful initiation for now - REMOVE FOR PRODUCTION AND UNCOMMENT ABOVE
    const mockWaafiResult = {
      responseCode: "2001", // Replace with actual Waafi success code from their docs
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      transactionId: "WFP_MOCK_" + Date.now(), // Waafi's transaction ID
    };
    // ****************************************************************************************


    console.log("[API /api/waafi/initiate] Mock Waafi initiation successful on server:", mockWaafiResult);
    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      transactionReference: transactionId, // Our internal transaction ID
      waafiReference: mockWaafiResult.transactionId, // Waafi's transaction ID
    });

  } catch (error: any) {
    console.error('[API /api/waafi/initiate] Error in catch block:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}

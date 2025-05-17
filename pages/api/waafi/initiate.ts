
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Waafi Credentials from Environment Variables
// Ensure these are set in your .env.local file (and Vercel environment variables for deployment)
// Example .env.local entries:
// WAAFI_API_KEY="API-1922135978AHX" (This is your "Api-Key")
// WAAFI_MERCHANT_ID="M0910161" (This is your "MerchantUid")
// WAAFI_API_USER_ID="1000146" (This is your "ApiUserId" - see note below)
// WAAFI_API_SECRET="your_waafi_api_secret_if_any"
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
const WAAFI_API_USER_ID = process.env.WAAFI_API_USER_ID; // Added for clarity if needed in payload

// THIS IS A FICTIONAL/PLACEHOLDER ENDPOINT - REPLACE WITH ACTUAL WAAFI DOCUMENTATION
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Example, replace with actual

const getAppBaseUrl = (req: NextApiRequest) => {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:9002';
  return `${protocol}://${host}`;
};

interface WaafiInitiateRequestBody {
  amount: number;
  currency: string;
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
  console.log("[API /api/waafi/initiate] Received request. Method:", req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.log("[API /api/waafi/initiate] Method Not Allowed:", req.method);
    return res.status(405).end('Method Not Allowed');
  }

  console.log("[API /api/waafi/initiate] Request Body:", req.body);

  if (!WAAFI_API_KEY || !WAAFI_MERCHANT_ID) {
    console.error(`[API /api/waafi/initiate] Critical Configuration Error:
      WAAFI_API_KEY: ${WAAFI_API_KEY ? 'Set' : 'MISSING'}
      WAAFI_MERCHANT_ID: ${WAAFI_MERCHANT_ID ? 'Set' : 'MISSING'}
      Please ensure WAAFI_API_KEY and WAAFI_MERCHANT_ID are correctly set in your .env.local file and that the server was restarted.`);
    return res.status(500).json({ success: false, message: "Payment gateway configuration error. Please check server logs. [WCFG01]" });
  }
  // Note: WAAFI_API_USER_ID might be used within the Waafi payload if required by their API,
  // not necessarily for direct API authentication headers like WAAFI_API_KEY.
  // Example: if (WAAFI_API_USER_ID) { waafiPayload.serviceParams.apiUserId = WAAFI_API_USER_ID; }


  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata || typeof metadata.originalAmountKES === 'undefined') {
    console.error("[API /api/waafi/initiate] Missing required payment details:", req.body);
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  const waafiAmount = amount; // This is KES amount; ensure it's converted to USD if needed by Waafi API
  const waafiCurrency = currency.toUpperCase(); // Expected to be "USD"

  const transactionId = `WAAFI_${userId}_${Date.now()}`;
  const appBaseUrl = getAppBaseUrl(req);
  const callbackUrl = `${appBaseUrl}/api/waafi/callback`;

  console.log(`[API /api/waafi/initiate] App Base URL: ${appBaseUrl}, Callback URL: ${callbackUrl}`);

  // CONSULT WAAFI DOCUMENTATION for the correct payload structure.
  // The 'paymentMethod' and other 'serviceParams' will be specific to Waafi.
  // The 'apiUserId' parameter (1000146 in your case) might go into 'serviceParams'.
  const waafiPaymentMethod = "EVCPLUS"; // <<<<< CONSULT WAAFI DOCS AND REPLACE THIS

  const waafiPayload = {
    schemaVersion: '1.0', // Or Waafi's current version
    requestId: transactionId,
    timestamp: new Date().toISOString(),
    channelName: 'WEB',
    serviceName: 'API_PURCHASE', // Or specific service name from Waafi
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID, // Your "MerchantUid"
      apiUserId: WAAFI_API_USER_ID || WAAFI_API_KEY, // WAAPI API might require apiUserId here, check their docs. Using WAAFI_API_KEY as a placeholder if apiUserId is separate.
      // If WAAFI_API_KEY is used for Authorization header, then apiUserId (1000146) might be needed here.
      // Example: apiUserId: "1000146",
      paymentMethod: waafiPaymentMethod,
      payerInfo: {
        msisdn: phoneNumber,
      },
      transactionInfo: {
        referenceId: transactionId,
        invoiceId: `INV_${transactionId}`,
        amount: waafiAmount.toString(), // Waafi might expect amount as string
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
    console.log("[API /api/waafi/initiate] Initiating Waafi payment with MOCK payload (actual API call is commented out):", JSON.stringify(waafiPayload, null, 2));

    // ***** THIS IS A MOCK API CALL SECTION - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${WAAFI_API_KEY}` // Or other auth mechanism specified by Waafi
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
      responseCode: "2001", // Waafi's success code from their docs for STK push
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      transactionId: "WFP_MOCK_" + Date.now(), 
      // Potentially other fields like `params` containing info for app-to-app call
      // params: {
      //   appPackageName: "com.waafi.customer",
      //   deeplink: "waafi://payment?params=...",
      // }
    };
    // ****************************************************************************************


    console.log("[API /api/waafi/initiate] Mock Waafi initiation successful on server:", mockWaafiResult);
    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      transactionReference: transactionId, 
      waafiReference: mockWaafiResult.transactionId,
      // If Waafi returns parameters for an app-to-app call, include them:
      // waafiParams: mockWaafiResult.params 
    });

  } catch (error: any) {
    console.error('[API /api/waafi/initiate] Error in catch block:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}

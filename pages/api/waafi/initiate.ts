
// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Waafi Credentials from Environment Variables
// These MUST be set in your .env.local file for local development
// AND as Environment Variables in your Vercel project settings for deployment.
//
// Example .env.local entries:
// WAAFI_API_KEY="API-1922135978AHX" (This is your "Api-Key" from Waafi)
// WAAFI_MERCHANT_ID="M0910161"      (This is your "MerchantUid" from Waafi)
// WAAFI_API_USER_ID="1000146"     (This is your "ApiUserId" from Waafi, if distinct from API Key owner)
// WAAFI_API_SECRET="your_waafi_api_secret_if_any_for_signature_or_callbacks"
//
// NEXT_PUBLIC_APP_BASE_URL="http://localhost:9002" (for local dev)
// OR
// NEXT_PUBLIC_APP_BASE_URL="https://minti-c6ls.vercel.app" (for your Vercel deployment)

const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
const WAAFI_API_USER_ID = process.env.WAAFI_API_USER_ID; // Specific user ID for API calls, provided as "1000146"

// THIS IS A FICTIONAL/PLACEHOLDER ENDPOINT - REPLACE WITH ACTUAL WAAFI DOCUMENTATION
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Example, replace

const getAppBaseUrl = (req: NextApiRequest) => {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  }
  // Fallback for Vercel system environment variable (less reliable for API routes than NEXT_PUBLIC_APP_BASE_URL)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development if NEXT_PUBLIC_APP_BASE_URL is not set
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:9002'; // Default to your dev port
  return `${protocol}://${host}`;
};

interface WaafiInitiateRequestBody {
  amount: number; // This is the KES amount from your packages
  currency: string; // This will be "USD"
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
    console.error(`[API /api/waafi/initiate] Waafi API Key or Merchant ID is not configured in environment variables (WAAFI_API_KEY, WAAFI_MERCHANT_ID).`);
    return res.status(500).json({ success: false, message: "Payment gateway configuration error. [WCFG01]" });
  }
  if (!WAAFI_API_USER_ID) {
    console.warn(`[API /api/waafi/initiate] WAAFI_API_USER_ID is not configured. Depending on Waafi's API, this might be required in the payload.`);
  }


  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata || typeof metadata.originalAmountKES === 'undefined') {
    console.error("[API /api/waafi/initiate] Missing required payment details:", req.body);
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  // IMPORTANT: Amount Conversion.
  // The `amount` received here is from your KES packages.
  // If Waafi's API expects the `amount` field to be in USD, you MUST convert `metadata.originalAmountKES`
  // to USD here using a reliable exchange rate before putting it into `waafiAmount`.
  // For now, we'll pass the KES numerical value, assuming Waafi handles it or it's intended as USD.
  const waafiAmount = metadata.originalAmountKES; // This should be converted to USD if Waafi expects USD value.
  const waafiCurrency = "USD"; // As per your instruction

  const transactionId = `WAAFI_${userId}_${Date.now()}`;
  const appBaseUrl = getAppBaseUrl(req);
  const callbackUrl = `${appBaseUrl}/api/waafi/callback`;

  console.log(`[API /api/waafi/initiate] App Base URL: ${appBaseUrl}, Callback URL: ${callbackUrl}`);


  // CONSULT WAAFI DOCUMENTATION for the correct payload structure and payment methods.
  // The `paymentMethod` string needs to be what Waafi expects for EVC, ZAAD, etc.
  // Example values: "EVCPLUS", "ZAAD_SOMALIA", "SAHAL_SOMTEL", "WAAFI_WALLET_SOMALIA" - CHECK WAAFI DOCS!
  const waafiPaymentMethod = "EVCPLUS"; // <<<<< REPLACE THIS with the correct Waafi method code.

  const waafiPayload = {
    schemaVersion: '1.0', // Or Waafi's current version
    requestId: transactionId, // Unique request ID
    timestamp: new Date().toISOString(),
    channelName: 'WEB', // Or as specified by Waafi for API integrations
    serviceName: 'API_PURCHASE', // Or specific service name from Waafi for this type of transaction
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID, // Your "MerchantUid"
      apiUserId: WAAFI_API_USER_ID,   // Your "ApiUserId" for your Waafi merchant account
      paymentMethod: waafiPaymentMethod, // e.g., "EVCPLUS", "ZAAD", "SAHAL" - check Waafi docs
      payerInfo: {
        msisdn: phoneNumber, // User's phone number for Waafi
      },
      transactionInfo: {
        referenceId: transactionId, // Your internal transaction ID
        invoiceId: `INV_${transactionId}`, // A unique invoice ID
        amount: waafiAmount.toString(), // Amount as a string, ensure this is in USD if currency is USD
        currency: waafiCurrency,       // Should be "USD"
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        // Waafi will POST to this URL with the transaction status
        notifyUrl: callbackUrl,
      },
      // Custom parameters to be returned in the callback
      customParameters: {
        userId,
        coins: metadata.coins,
        originalAmountKES: metadata.originalAmountKES,
        packageName: metadata.packageName,
        internalTxId: transactionId // Include your internal transaction ID
      },
    },
  };

  try {
    console.log("[API /api/waafi/initiate] Sending Waafi initiation request. Payload (first level):", {
      schemaVersion: waafiPayload.schemaVersion,
      requestId: waafiPayload.requestId,
      channelName: waafiPayload.channelName,
      serviceName: waafiPayload.serviceName,
      // Not logging full serviceParams here to avoid overly verbose logs unless needed
    });
    console.log("[API /api/waafi/initiate] Full Waafi Payload (for debugging, check sensitive data):", JSON.stringify(waafiPayload, null, 2));


    // ***** THIS IS A MOCK API CALL SECTION - REPLACE WITH ACTUAL WAAFI API INTEGRATION *****
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${WAAFI_API_KEY}` // Or 'Api-Key': WAAFI_API_KEY - CHECK WAAFI DOCS
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
      responseCode: "2001", // Waafi's success code for STK push (example)
      responseMsg: "Request processed successfully. User will be prompted on their phone.",
      transactionId: "WFP_MOCK_" + Date.now(), 
      // Potentially other fields like `params` containing info for app-to-app call
      // params: {
      //   appPackageName: "com.waafi.customer", // Example package name for Waafi app
      //   deeplink: "waafi://payment?params=...", // Example deeplink
      // }
    };
    // ****************************************************************************************


    console.log("[API /api/waafi/initiate] Mock Waafi initiation successful on server:", mockWaafiResult);
    return res.status(200).json({
      success: true,
      message: mockWaafiResult.responseMsg,
      transactionReference: transactionId, // Your internal reference
      waafiReference: mockWaafiResult.transactionId, // Waafi's reference from their system
      // If Waafi returns parameters for an app-to-app call (if applicable), include them:
      // waafiParams: mockWaafiResult.params 
    });

  } catch (error: any) {
    console.error('[API /api/waafi/initiate] Error during Waafi payment initiation (catch block):', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation. [WSRV_INIT_ERR]' });
  }
}


// pages/api/waafi/initiate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// IMPORTANT: Replace with actual Waafi API details and logic
const WAAFI_API_KEY = process.env.WAAFI_API_KEY;
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID;
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.com/payment"; // Fictional endpoint - REPLACE WITH ACTUAL WAAFI ENDPOINT

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
  return process.env.NODE_ENV === 'production' ? 'https://minti-c6ls.vercel.app/' : 'http://localhost:9002';
};


interface WaafiInitiateRequestBody {
  amount: number; // Original KES amount from package
  currency: string; // Target currency for Waafi (should be "USD" as per latest request)
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

  if (currency.toUpperCase() !== "USD") {
    // This is an internal check. The frontend should be sending "USD".
    console.warn(`Waafi API received currency '${currency}' but expected 'USD'. Proceeding with '${currency}'.`);
  }
  
  // The 'amount' received here is the KES value from the package.
  // If Waafi expects this 'amount' to be in USD, then a conversion from KES to USD is needed here.
  // For now, we are passing the numerical value of KES as 'waafiAmount' and labeling it with 'waafiCurrency' (USD).
  // This implies Waafi will either interpret 'amount' as USD or perform a conversion.
  // TODO: Implement actual KES to USD conversion here if Waafi's API requires the amount to be in USD.
  const waafiAmount = amount; // This is the KES numerical value.
  const waafiCurrency = currency.toUpperCase(); // Should be "USD"

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
      apiUserId: WAAFI_API_KEY, // Or however Waafi auth works (e.g. API secret in headers)
      paymentMethod: 'MWALLET_ACCOUNT', // ** THIS IS A CRITICAL FIELD **
                                       // Replace 'MWALLET_ACCOUNT' with the specific code Waafi uses for
                                       // the desired mobile money service (e.g., EVC, ZAAD, SAHAL) or their own wallet.
                                       // Example values might be: "EVCPLUS", "ZAAD_SERVICE", "SAHAL_PAY", "WAAFI_WALLET".
                                       // Check Waafi's API documentation for the correct values.
      payerInfo: {
        msisdn: phoneNumber, // Customer's phone number for Waafi
      },
      transactionInfo: {
        referenceId: transactionId, // Your internal reference ID
        invoiceId: `INV_${transactionId}`, // Can be same as referenceId or different
        amount: waafiAmount.toString(), // Amount in target currency (USD), ensure it's a string if Waafi expects that
        currency: waafiCurrency, // Should be "USD"
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
      merchantCallbacks: {
        notifyUrl: callbackUrl, // Waafi will POST to this URL after payment attempt
      },
      // Pass our internal metadata through Waafi if possible
      // This helps reconcile the transaction in the callback. Check Waafi docs for their field name.
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
    
    // Example of what a real fetch might look like:
    // const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add Waafi specific auth headers, e.g.,
    //     // 'Authorization': `Bearer YOUR_WAAFI_ACCESS_TOKEN`,
    //     // 'X-API-KEY': WAAFI_API_KEY, (if it's a header key)
    //     // 'X-App-Secret': process.env.WAAFI_API_SECRET (if applicable)
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
      // Example: Waafi might return a redirectURL if it's a hosted page flow for some methods
      // redirectUrl: "https://checkout.waafipay.com/..." 
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

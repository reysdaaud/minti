const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:9002', 'https://checkout.paystack.com'], // Added http://localhost:9002 from original
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'], // Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
   // Let CORS middleware handle Access-Control-Allow-Origin more dynamically
  const requestOrigin = req.headers.origin;
  if (['http://localhost:3000', 'http://localhost:9002', 'https://checkout.paystack.com'].includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    // Fallback or default, be cautious with '*' in production
    // res.setHeader('Access-Control-Allow-Origin', '*'); 
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error('Missing Paystack secret key (PAYSTACK_SECRET_KEY)');
  process.exit(1);
}

// Paystack initialization endpoint
app.post('/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    
    if (!email || !amount) {
      return res.status(400).json({
        status: false,
        message: 'Email and amount are required'
      });
    }
     if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
            status: false,
            message: 'Amount must be a positive number'
        });
    }

    // Use dynamic callback based on environment or request context if possible
    // Forcing to 3000 as per user's provided code, but this was more dynamic before.
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `http://localhost:3000/`; // Defaulting to root, was /dashboard in user code.
                                                                                    // The previous version used req.socket.localPort to try and match client.

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(amount * 100), // Convert to kobo/cents, ensure it's an integer
        currency: 'KES',
        callback_url: callbackUrl,
        channels: ['card', 'mobile_money'], // Reverted to include mobile_money as per original project state
        metadata: { // This structure matches the original project's working version
          ...metadata, // Spread incoming metadata first
          custom_fields: [ 
            {
              display_name: "User ID",
              variable_name: "user_id", // Ensure this is consistent with verification
              value: metadata?.userId || "N/A" // Use metadata.userId passed from client
            },
            {
              display_name: "Package Name",
              variable_name: "package_name",
              value: metadata?.packageName || "N/A"
            },
            {
                display_name: "Coins",
                variable_name: "coins", // Ensure this is consistent
                value: metadata?.coins ? metadata.coins.toString() : "N/A"
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, // Use the live/main secret key
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Payment initialized:', {
      reference: response.data.data.reference,
      access_url: response.data.data.authorization_url,
      callback_url: callbackUrl
    });

    res.json(response.data);

  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message, error.stack);
    res.status(error.response?.status || 500).json({
      status: false,
      message: error.response?.data?.message || 'Could not initialize payment',
      error: error.response?.data || error.message
    });
  }
});

// Paystack verification endpoint
app.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          // CRITICAL: Use the MAIN PAYSTACK_SECRET_KEY for verification, NOT a test key.
          // The user's provided server.js used process.env.PAYSTACK_TEST_KEY here, which is incorrect for verifying live transactions
          // or even test transactions initiated with the main secret key.
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      const transactionData = response.data.data;
      const { customer, metadata, amount } = transactionData;
      
      // Extract from custom_fields if that's where they are now, or directly if top-level
      let userId, coinsToAdd, packageName;

      if (metadata && Array.isArray(metadata.custom_fields)) {
          userId = metadata.custom_fields.find(f => f.variable_name === 'user_id')?.value;
          coinsToAdd = parseInt(metadata.custom_fields.find(f => f.variable_name === 'coins')?.value, 10);
          packageName = metadata.custom_fields.find(f => f.variable_name === 'package_name')?.value || "N/A";
      } else if (metadata) { // Fallback for direct metadata properties if custom_fields isn't used as expected
          userId = metadata.user_id || metadata.userId; // Covering both potential key names
          coinsToAdd = parseInt(metadata.coins, 10);
          packageName = metadata.package_name || metadata.packageName || "N/A";
      }
      
      const userEmail = customer.email;

      if (!userId || isNaN(coinsToAdd)) {
        console.error('Verification error: Missing userId or coins in metadata', metadata);
        return res.status(400).json({ status: false, message: 'Invalid transaction metadata from Paystack.' });
      }

      const userRef = db.collection('users').doc(userId);
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        const paymentData = {
          amount: amount / 100, 
          coins: coinsToAdd,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reference: reference,
          status: 'success',
          packageName: packageName
        };

        if (!userDoc.exists) {
          transaction.set(userRef, {
            email: userEmail, 
            coins: coinsToAdd,
            lastPayment: paymentData,
            paymentHistory: [paymentData],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          const currentCoins = userDoc.data().coins || 0;
          transaction.update(userRef, {
            coins: currentCoins + coinsToAdd,
            lastPayment: paymentData,
            paymentHistory: admin.firestore.FieldValue.arrayUnion(paymentData),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      console.log('Payment verified and processed:', {
        reference,
        userId,
        coinsAdded: coinsToAdd
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message, error.stack);
    res.status(error.response?.status || 500).json({
      status: false,
      message: error.response?.data?.message ||'Could not verify payment',
      error: error.response?.data || error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('CORS enabled for origins:', ['http://localhost:3000', 'http://localhost:9002', 'https://checkout.paystack.com']);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Note: req is not available at server start to determine req.socket.localPort
  // Callback URL logic needs to be consistent or passed from client if dynamic matching is desired.
  // For now, it's dynamically determined in the /initialize endpoint.
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
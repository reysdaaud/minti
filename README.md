# Firebase Studio Project (NeoWallet)

This is a Next.js starter project for NeoWallet, a modern digital banking solution, in Firebase Studio.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Environment Variables

This project requires several environment variables for connecting to Firebase, Paystack, and other services.

1.  Create a `.env.local` file in the root of the project. You can copy the contents of `.env.example` as a template:
    ```bash
    cp .env.example .env.local
    ```
2.  Fill in the values in `.env.local` with your actual credentials and API keys.

    **Frontend (Next.js - `src/app/**`):**
    *   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Your Paystack Public Key (e.g., `pk_test_xxxxxxxxxxxx` or `pk_live_xxxxxxxxxxxx`).
    *   `NEXT_PUBLIC_PAYMENT_BACKEND_URL`: The URL of your payment backend server. For local development, this is usually `http://localhost:5000`.

    **Backend (Express - `server.js`):**
    *   `FIREBASE_PROJECT_ID`: Your Firebase Project ID.
    *   `FIREBASE_PRIVATE_KEY`: Your Firebase Admin SDK Private Key. Make sure to replace newline characters `\n` with actual newlines if copying from a JSON file, or handle it appropriately (the `server.js` replaces `\\n` with `\n`).
    *   `FIREBASE_CLIENT_EMAIL`: Your Firebase Admin SDK Client Email.
    *   `PAYSTACK_SECRET_KEY`: Your Paystack Secret Key (e.g., `sk_test_xxxxxxxxxxxx` or `sk_live_xxxxxxxxxxxx`). **Keep this secret and never expose it on the client-side.**
    *   `PORT`: (Optional) The port for the backend server to run on. Defaults to `5000`.
    *   `PAYSTACK_CALLBACK_URL`: (Optional) The default Paystack callback URL if not dynamically determined.

### Firebase Admin SDK Setup

The backend server (`server.js`) uses the Firebase Admin SDK to interact with Firestore (e.g., updating user coin balances).
1.  Go to your Firebase Project Settings > Service accounts.
2.  Generate a new private key and download the JSON file.
3.  Use the `projectId`, `privateKey`, and `clientEmail` from this JSON file for the environment variables mentioned above.

### Running the Application Locally

The application consists of a Next.js frontend and an Express.js backend (`server.js`) for payment processing.

To run both the frontend and backend concurrently:

```bash
npm run dev
# or
yarn dev
```

This command will:
1.  Start the Next.js development server (usually on `http://localhost:9002`).
2.  Start the Express.js backend server (`server.js`) (usually on `http://localhost:5000`).

**Important:** The backend server (`server.js`) **must be running** for payment initialization and verification to work. If you encounter "Failed to fetch" errors related to `http://localhost:5000/paystack/initialize`, it's likely the backend server is not running or is inaccessible.

To get started with development, take a look at `src/app/page.tsx`.

### Building for Production

```bash
npm run build
npm run start
```
This will build the Next.js application. You will need to ensure your `server.js` is also deployed and running in your production environment, and that `NEXT_PUBLIC_PAYMENT_BACKEND_URL` points to your deployed backend URL.

## Key Components

-   **Authentication**: Handled via Firebase Authentication (Google Sign-In). See `src/lib/firebase.tsx` and `src/app/auth/signin/page.tsx`.
-   **Payment Processing**: Uses Paystack.
    -   Frontend: `src/components/exchange/Pay.tsx` and `src/components/exchange/PaystackButton.tsx` handle the UI and initial call to the backend.
    -   Backend: `server.js` handles Paystack API communication (initialization, verification) and Firestore updates.
-   **State Management**: Primarily uses React Context API (`src/contexts/AuthContext.tsx`) and component state.
-   **UI Components**: Built with ShadCN UI (`src/components/ui/`) and custom components (`src/components/exchange/`).
-   **Styling**: Tailwind CSS (`tailwind.config.ts`) and global styles (`src/app/globals.css`).

## Troubleshooting

-   **"Failed to fetch" payment error**: Ensure your backend server (`server.js`) is running. Use `npm run dev` to start both servers. Check your browser's developer console for more specific network error messages.
-   **Paystack "Invalid Key" error**: Double-check your `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.local` (for the frontend) and `PAYSTACK_SECRET_KEY` (for the backend). Ensure you are using the correct key type (public for frontend, secret for backend) and that they are for the correct mode (test/live).
-   **CORS errors**: The `server.js` includes CORS configuration. If you change frontend/backend ports or deploy to different domains, you might need to update the `origin` list in `server.js`.

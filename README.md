# Firebase Studio Project (NeoWallet)

This is a Next.js starter project for NeoWallet, a modern digital banking solution, in Firebase Studio.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Environment Variables

This project requires several environment variables for connecting to Firebase and Paystack.

1.  Create a `.env.local` file in the root of the project. You can copy the contents of `.env.example` as a template:
    ```bash
    cp .env.example .env.local
    ```
2.  Fill in the values in `.env.local` with your actual credentials and API keys.

    **Frontend (Next.js - `src/app/**`):**
    *   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Your Paystack Public Key (e.g., `pk_test_xxxxxxxxxxxx` or `pk_live_xxxxxxxxxxxx`). This key is used directly in the frontend for Paystack integration.
    *   Firebase configuration details (apiKey, authDomain, etc.) are typically embedded in `src/lib/firebase.tsx` or loaded via environment variables if you choose to abstract them further for different Firebase projects.

    **Important Security Note for Paystack Keys:**
    *   Your **Paystack Secret Key** (`sk_test_...` or `sk_live_...`) should **NEVER** be exposed in your frontend code or committed to your repository. For a production application, operations requiring the secret key (like server-side verification, refunds) MUST be handled by a secure backend server.
    *   The current implementation uses a client-side only approach with `react-paystack` which relies on the public key. While this simplifies development, for robust transaction verification and security, a backend is typically involved.

### Firebase Setup

The application uses Firebase for authentication (Google Sign-In) and Firestore for storing user data (like coin balances).
1.  Set up a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  Enable Google Sign-In in the Firebase Authentication section.
3.  Set up Firestore database and configure security rules as needed.
4.  The Firebase configuration (apiKey, authDomain, etc.) is in `src/lib/firebase.tsx`. Ensure these match your Firebase project settings.

### Running the Application Locally

The application is a Next.js frontend.

To run the Next.js frontend:

```bash
npm run dev
# or
yarn dev
```

This command will:
1.  Start the Next.js development server (usually on `http://localhost:9002`).

To get started with development, take a look at `src/app/page.tsx`.

### Building for Production

```bash
npm run build
npm run start
```
This will build and start the Next.js application.

## Key Components

-   **Authentication**: Handled via Firebase Authentication (Google Sign-In). See `src/lib/firebase.tsx` and `src/app/auth/signin/page.tsx`.
-   **Payment Processing**: Uses Paystack via the `react-paystack` library for client-side integration.
    -   Frontend: `src/components/exchange/Pay.tsx` and `src/components/exchange/PaystackButton.tsx` handle the UI and payment flow. Firestore updates for coin balances occur client-side after successful payment.
-   **State Management**: Primarily uses React Context API (`src/contexts/AuthContext.tsx` which re-exports from `src/lib/firebase.tsx`) and component state.
-   **UI Components**: Built with ShadCN UI (`src/components/ui/`) and custom components (`src/components/exchange/`).
-   **Styling**: Tailwind CSS (`tailwind.config.ts`) and global styles (`src/app/globals.css`).

## Troubleshooting

-   **Paystack "Invalid Key" error**: Double-check your `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.local`. Ensure it's the correct public key (test or live) and is not accidentally a secret key.
-   **Paystack Not Initializing**: Ensure `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is correctly set and accessible by the `PaystackButton.tsx` component. Check the browser console for any specific errors from the `react-paystack` library.
-   **CORS errors**: While the backend server is removed, if you integrate with other external APIs directly from the client, ensure they have appropriate CORS policies.
-   **Firebase Issues**: Verify your Firebase project configuration in `src/lib/firebase.tsx` is correct and that your Firestore security rules allow the operations performed by the app.

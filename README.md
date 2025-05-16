
# Firebase Studio Project (NeoWallet)

This is a Next.js starter project for NeoWallet, a modern digital banking solution, in Firebase Studio.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Git

### Environment Variables

This project requires several environment variables. Create a `.env.local` file in the root of your project by copying `.env.example` (if one exists) or by creating it manually.

**Required for Paystack:**
*   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Your Paystack Public Key (e.g., `pk_test_xxxxxxxxxxxx` or `pk_live_xxxxxxxxxxxx`).
*   `NEXT_PUBLIC_PAYSTACK_SECRET_KEY_LIVE`: Your Paystack **LIVE Secret Key** (e.g., `sk_live_xxxxxxxxxxxx`).
    *   **SECURITY WARNING:** Exposing a `SECRET_KEY` prefixed with `NEXT_PUBLIC_` makes it available on the client-side. This is **highly insecure** for production. For production, secret key operations (like server-side verification) MUST be handled by a secure backend API. This setup is for simplified development and testing with acknowledged risk.

**Required for Waafi (Somali Mobile Money):**
*   `WAAFI_API_KEY`: Your Waafi API Key.
*   `WAAFI_MERCHANT_ID`: Your Waafi Merchant ID.
*   `WAAFI_API_SECRET` (or similar, e.g., `WAAFI_WEBHOOK_SECRET`): Any secret used for authenticating API calls or verifying webhooks from Waafi. (Consult Waafi documentation for exact names).

**Required for Deployment (e.g., to Vercel):**
*   `NEXT_PUBLIC_APP_BASE_URL`: The full base URL of your deployed application (e.g., `https://your-app-name.vercel.app`). This is crucial for constructing callback URLs for payment gateways.

**Firebase Configuration:**
Firebase API keys and project details are currently hardcoded in `src/lib/firebase.tsx`. Ensure these match your Firebase project settings.

### Firebase Setup

The application uses Firebase for:
1.  Authentication (Google Sign-In)
2.  Firestore Database (user profiles, content, wallet balances, payment history)

**Steps:**
1.  Set up a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  In your Firebase project, enable **Google Sign-In** in the Authentication section.
3.  Set up **Firestore Database**.
4.  Configure **Security Rules** for Firestore to protect your data.
5.  Ensure the Firebase configuration object in `src/lib/firebase.tsx` matches your project's settings.

### Running the Application Locally

```bash
npm install
npm run dev
# or
yarn
yarn dev
```
This will start the Next.js development server (usually on `http://localhost:9002`).

### Building for Production

```bash
npm run build
npm run start
```

### Deploying to Vercel

1.  Push your project to a Git repository (GitHub, GitLab, Bitbucket).
2.  Sign up/log in to [Vercel](https://vercel.com/).
3.  Import your Git repository into Vercel.
4.  Configure Environment Variables in Vercel project settings (ensure all variables listed in the ".env.local" section above are set, especially `NEXT_PUBLIC_APP_BASE_URL` for your Vercel domain).
5.  Deploy.
6.  **Important:** Add your Vercel deployment URL (e.g., `your-app-name.vercel.app`) to the "Authorized domains" list in your Firebase project's Authentication settings for Google Sign-In to work.

## Key Components

-   **Authentication**: Firebase Authentication (Google Sign-In). Managed in `src/lib/firebase.tsx` and `src/contexts/AuthContext.tsx`. Profile setup flow in `src/app/profile/`.
-   **Payment Processing**:
    -   **Paystack**: Client-side integration using `react-paystack` via `src/components/exchange/PaystackButton.tsx`. Server-side verification is handled by `src/app/page.tsx` (client-side verification using a secret key, **not recommended for production**).
    -   **Waafi**: Client-side initiation via `src/components/exchange/WaafiButton.tsx` calls backend API routes `pages/api/waafi/initiate.ts` and `pages/api/waafi/callback.ts`.
-   **State Management**: React Context API (`src/contexts/AuthContext.tsx`, `src/contexts/PlayerContext.tsx`) and component state.
-   **Content Management**:
    -   Content (audio, articles) stored in Firestore `content` collection.
    -   Admin panel at `/admin` for CRUD operations (see `src/app/admin/` and `src/services/contentService.ts`).
-   **UI Components**: ShadCN UI (`src/components/ui/`) and custom components.
-   **Styling**: Tailwind CSS (`tailwind.config.ts`) and global styles (`src/app/globals.css`).

## Troubleshooting

-   **Payment Gateway "Invalid Key" error**: Double-check your public keys in `.env.local` and Vercel environment variables.
-   **Payment Verification Failures**: Ensure secret keys (if used on client for testing) are correct. For production, Paystack verification MUST be server-side. Ensure Waafi callback URLs and webhook secrets are correctly configured.
-   **CORS errors**: If integrating with external APIs, ensure they have appropriate CORS policies. Your Next.js API routes are same-origin.
-   **Firebase Issues**: Verify Firebase project configuration and Firestore security rules.
-   **Missing Modules on Vercel Deploy:** Ensure all files, especially new ones, are committed and pushed to your Git repository. Check for filename casing issues.
-   **Firestore Index Errors:** Check browser console for Firestore errors indicating missing indexes. Create them using the link provided by Firebase.

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google User profile images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // For Firebase Storage
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'wirenext-b4b65.appspot.com', // For Firebase Storage (alternative domain)
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;

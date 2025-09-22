const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      // Proxy all API requests to the FastAPI backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      // Also proxy the analysis endpoint
      {
        source: '/analysis/:path*',
        destination: 'http://localhost:8000/analysis/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Allow CORS for all routes
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  images: {
    domains: ['localhost'],
  },
  // Enable experimental features if needed
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;

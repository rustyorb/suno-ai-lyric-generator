/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  publicRuntimeConfig: {
    NEXT_PUBLIC_ENABLE_PROVIDER_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_PROVIDER_MANAGEMENT || 'true',
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Title, User-Agent, X-Custom-Auth' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  poweredByHeader: false,
  compress: true,
  // Development server configuration
  devServer: {
    hot: true,
    port: 3002,
  },
};

module.exports = nextConfig;

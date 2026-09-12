/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize images
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.tradingview.com' },
      { protocol: 'https', hostname: 'www.gstatic.com' },
    ],
    minimumCacheTTL: 3600,
  },

  // Remove X-Powered-By header (belt-and-suspenders with middleware)
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep console.error / console.warn)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Experimental: faster builds
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts',
    ],
  },
};

module.exports = nextConfig;

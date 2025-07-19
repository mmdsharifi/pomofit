// Cleaned up next.config.mjs: no dynamic import of v0-user-next.config

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Add headers for PWA and performance
  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      // Performance headers for static assets
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Add rewrites to handle service worker and manifest
  async rewrites() {
    return [
      {
        source: "/service-worker.js",
        destination: "/_next/static/service-worker.js",
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000,
  },

  // Performance optimizations
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },

  // Optimize webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Enable tree shaking and minification
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer || [];
    }

    // Optimize chunks to prevent too many small chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 70000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: "~",
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Separate React and React DOM
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
            priority: 40,
          },
          // Separate UI components
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: "ui",
            chunks: "all",
            priority: 30,
          },
        },
      };
    }

    // Enable module concatenation
    config.optimization.concatenateModules = true;

    return config;
  },

  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;

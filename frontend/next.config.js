/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['recharts', 'framer-motion', 'motion-dom', 'tiny-invariant', 'recharts-scale'],
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
  },
  webpack: (config, { isServer }) => {
    const reactPath = require.resolve('react', { paths: [__dirname] });
    const reactDomPath = require.resolve('react-dom', { paths: [__dirname] });
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.dirname(reactPath),
      'react-dom': path.dirname(reactDomPath),
    };

    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  transpilePackages: ['recharts', 'framer-motion', 'motion-dom', 'tiny-invariant', 'recharts-scale'],
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.dirname(require.resolve('react')),
      'react-dom': path.dirname(require.resolve('react-dom')),
      'tiny-invariant': path.dirname(require.resolve('tiny-invariant')),
      'recharts-scale': path.dirname(require.resolve('recharts-scale')),
    };
    return config;
  },
};

module.exports = nextConfig;

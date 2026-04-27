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
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'tiny-invariant': path.resolve(__dirname, './node_modules/tiny-invariant'),
      'recharts-scale': path.resolve(__dirname, './node_modules/recharts-scale'),
    };
    return config;
  },
};

module.exports = nextConfig;

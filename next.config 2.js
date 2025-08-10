/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'i.ytimg.com',
      'img.youtube.com',
      'localhost',
    ],
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
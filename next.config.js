/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.crunchbase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'home.vmt.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;


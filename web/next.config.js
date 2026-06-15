/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle for the Docker image.
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  rewrites: () => [
    {
      source: "/api/:path*",
      destination: "/src/pages/api/:path*",
    },
  ],
  images: {
    domains: ["lh3.googleusercontent.com"], // Add this line
  },
};

export default nextConfig;

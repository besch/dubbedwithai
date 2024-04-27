/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: () => [
    {
      source: "/api/:path*",
      destination: "/src/pages/api/:path*",
    },
  ],
};

export default nextConfig;

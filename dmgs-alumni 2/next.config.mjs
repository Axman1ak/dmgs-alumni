/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket for profile photos
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;

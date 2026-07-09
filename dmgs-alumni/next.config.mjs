/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket for profile photos
      { protocol: "https", hostname: "*.supabase.co" },
      // The school's own site (crest, campus photos) while not yet self-hosted
      { protocol: "https", hostname: "www.dohertyijero.com.ng" },
      { protocol: "https", hostname: "dohertyijero.com.ng" },
    ],
  },
};

export default nextConfig;

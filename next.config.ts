import type { NextConfig } from "next";

const isDevelopmentEnv = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    browserToTerminal: isDevelopmentEnv,
  },
  images: {
    dangerouslyAllowLocalIP: isDevelopmentEnv,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      
      // {
      //   protocol: "https",
      //   hostname: "ingredients.s3.us-east-1.amazonaws.com", // match your region
      //   port: "",
      //   pathname: "/**",
      // },
    ],
  },
};

export default nextConfig;
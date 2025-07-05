import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint:{
    ignoreDuringBuilds:true,
  },
  typescript:{
    ignoreBuildErrors:true,
  },
  images:{
    remotePatterns:[
      {hostname:'*',protocol:'https', port:'', pathname:'/**'}
    ]
  }
};

export default nextConfig;


//snapcast-cloned-pullzone.b-cdn.net
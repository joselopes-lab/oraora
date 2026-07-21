
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        '6000-firebase-studio-1767094630353.cluster-l2bgochoazbomqgfmlhuvdvgiy.cloudworkstations.dev',
        '*.cloudworkstations.dev',
        '*.hosted.app',
      ],
    },
  },
};

export default nextConfig;

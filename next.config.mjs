/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: 'raw.githubusercontent.com',
        protocol: 'https'
      },
      {
        hostname: 'github.com',
        protocol: 'https'
      }
    ]
  }
}

export default nextConfig

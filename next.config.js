/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Note: This feature is required to use NextJS Image in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@cloudscape-design/components',
    '@cloudscape-design/component-toolkit',
    '@cloudscape-design/design-tokens',
  ],
}

module.exports = nextConfig
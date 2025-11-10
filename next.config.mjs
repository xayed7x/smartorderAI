/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // This is the crucial part.
    // We are telling Webpack that for the server-side build,
    // the 'onnxruntime-node' module should be treated as an external dependency
    // and should not be bundled. It will be required at runtime via Node's `require`.
    if (isServer) {
      config.externals.push('onnxruntime-node');
    }

    return config;
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    productionBrowserSourceMaps: false, // Deshabilitar source maps para dificultar la lectura del código en producción
    output: 'standalone',
}

module.exports = nextConfig

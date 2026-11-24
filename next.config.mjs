/** @type {import('next').NextConfig} */
const cspBase = [
  "default-src 'self'",
  // 'unsafe-eval' is only needed by the dev server (React Refresh).
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://*.doubleclick.net https://www.googleadservices.com https://*.googleadservices.com https://*.googlesyndication.com https://www.google.com https://analytics.tiktok.com${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.doubleclick.net https://*.googlesyndication.com https://www.googleadservices.com https://*.googleadservices.com https://www.google.com https://*.google.com https://www.google.com.br https://*.google.com.br https://analytics.tiktok.com https://*.tiktokw.us",
  "frame-src 'self' https://www.googletagmanager.com https://*.googletagmanager.com https://*.doubleclick.net https://www.google.com https://www.youtube-nocookie.com https://www.youtube.com",
  "object-src 'none'",
  "base-uri 'self'",
  // Chrome also applies form-action to the redirect that follows a form post:
  // the Assinar / Gerenciar buttons post to our route, which redirects to Stripe.
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: cspBase.join("; "),
          },
        ],
      },
      {
        source: "/(app|admin)/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [...cspBase, "frame-ancestors 'none'"].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/queries";
import { NetworkStatusProvider } from "@/components/network-status-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "FairGo - Professional Taxi Service",
    template: "%s | FairGo",
  },
  description: "India's first AI-powered taxi booking platform. Call to book rides naturally in Malayalam, English, Manglish, Hindi, and more. Real-time tracking, multilingual support, and professional drivers.",
  keywords: ["FairGo", "taxi booking", "AI", "India", "ride sharing", "cab booking", "Malayalam", "Manglish", "voice booking", "real-time tracking"],
  authors: [{ name: "FairGo Team" }],
  creator: "FairGo",
  publisher: "FairGo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fairgo.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'ml-IN': '/ml-IN',
      'hi-IN': '/hi-IN',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'FairGo - Professional Taxi Service',
    description: 'Professional taxi booking with AI voice commands, real-time tracking, and multi-language support',
    siteName: 'FairGo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FairGo - Professional Taxi Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FairGo - Professional Taxi Service',
    description: 'Professional taxi booking with AI voice commands and real-time tracking',
    images: ['/twitter-image.png'],
    creator: '@fairgo_app',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FairGo',
  },
  applicationName: 'FairGo',
  category: 'travel',
  classification: 'Business',
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="FairGo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FairGo" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="//api.fairgo.app" />
        <link rel="dns-prefetch" href="//cdn.fairgo.app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            <NetworkStatusProvider>
              {children}
              <Toaster />
            </NetworkStatusProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

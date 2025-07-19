import type React from "react";
import "@/styles/globals.css";
import { Spline_Sans_Mono, Spline_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme-context";
import { TaskProvider } from "@/lib/task-context";
import { AuthProvider } from "@/lib/auth-context";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";
import PerformanceMonitor from "@/components/performance-monitor";

// Load fonts with optimized settings for performance
const splineSans = Spline_Sans({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-spline-sans-mono",
  fallback: ["monospace"],
  preload: true,
  adjustFontFallback: true,
});

export const metadata = {
  title: "Pomofit - Pomodoro Timer with Workouts",
  description: "Boost your productivity and fitness with Pomofit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pomofit",
  },
  formatDetection: {
    telephone: false,
  },
  generator: "v0.dev",
  // Performance optimizations
  other: {
    "X-DNS-Prefetch-Control": "on",
  },
};

export const viewport = {
  themeColor: "#ff6b00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/manifest.json"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />

        <meta name="application-name" content="Pomofit" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pomofit" />
        <meta name="description" content="Pomodoro Timer with Workouts" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ff6b00" />

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/apple-touch-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon-180x180.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/apple-touch-icon-167x167.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* iOS splash screens - optimized loading */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-2048-2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1668-2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1536-2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1125-2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-828-1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-750-1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-640-1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className={`${splineSans.className} ${splineSansMono.variable}`}>
        <AuthProvider>
          <ThemeProvider>
            <TaskProvider>
              {children}
              <Toaster />
              <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
              <PerformanceMonitor />
            </TaskProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

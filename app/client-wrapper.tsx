"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import PWARegister from "@/components/pwa-register";
import PWAAssetsCheck from "@/components/pwa-assets-check";

// Optimized loading component
const LoadingSkeleton = () => (
  <div className="container flex items-center justify-center min-h-screen">
    <div className="w-full max-w-3xl space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  </div>
);

// Dynamically import ClientPage with optimized settings
const ClientPage = dynamic(() => import("./ClientPage"), {
  ssr: false,
  loading: LoadingSkeleton,
  // Add suspense boundary for better loading experience
});

export default function ClientWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PWARegister />
      <PWAAssetsCheck />
      <ClientPage />
    </Suspense>
  );
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import PWARegister from "@/components/pwa-register";
import PWAAssetsCheck from "@/components/pwa-assets-check";

// Dynamically import ClientPage with no SSR to avoid context issues
const ClientPage = dynamic(() => import("./ClientPage"), {
  ssr: false,
  loading: () => (
    <div className="container flex items-center justify-center min-h-screen">
      <Skeleton className="h-[80vh] w-full max-w-3xl" />
    </div>
  ),
});

export default function ClientWrapper() {
  return (
    <>
      <PWARegister />
      <PWAAssetsCheck />
      <ClientPage />
    </>
  );
}

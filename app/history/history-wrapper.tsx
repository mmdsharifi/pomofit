"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import the client component with no SSR
const HistoryClient = dynamic(() => import("./history-client"), {
  ssr: false,
  loading: () => (
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  ),
})

export default function HistoryWrapper() {
  return <HistoryClient />
}

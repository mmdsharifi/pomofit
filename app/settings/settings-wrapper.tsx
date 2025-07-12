"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import the settings client component with no SSR
const SettingsClient = dynamic(() => import("./settings-client"), {
  ssr: false,
  loading: () => (
    <div className="p-3 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-10 w-40 mx-auto" />
    </div>
  ),
})

export default function SettingsWrapper() {
  return <SettingsClient />
}

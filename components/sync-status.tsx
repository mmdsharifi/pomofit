"use client";

import { useEffect, useState, useRef } from "react";
import { useOnlineStatus } from "@/lib/sync-utils";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CloudOff, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SyncStatus() {
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<
    "synced" | "syncing" | "offline" | "unauthenticated"
  >(user ? (isOnline ? "synced" : "offline") : "unauthenticated");
  const [pendingChanges, setPendingChanges] = useState(0);

  // Cache for sync queue data to reduce localStorage access
  const syncQueueCache = useRef<{ data: any[]; timestamp: number } | null>(
    null
  );
  const CACHE_DURATION = 30 * 1000; // 30 seconds

  // Check for pending changes in the sync queue
  useEffect(() => {
    if (!user || !isOnline) return;

    const checkSyncQueue = () => {
      try {
        const now = Date.now();

        // Use cached data if it's still valid
        if (
          syncQueueCache.current &&
          now - syncQueueCache.current.timestamp < CACHE_DURATION
        ) {
          const pendingOps = syncQueueCache.current.data.filter(
            (op: any) => !op.synced
          ).length;
          setPendingChanges(pendingOps);
          setSyncState(pendingOps > 0 ? "syncing" : "synced");
          return;
        }

        const queue = localStorage.getItem("pomofit-sync-queue");
        const syncQueue = queue ? JSON.parse(queue) : [];
        const pendingOps = syncQueue.filter((op: any) => !op.synced).length;

        // Update cache
        syncQueueCache.current = {
          data: syncQueue,
          timestamp: now,
        };

        setPendingChanges(pendingOps);
        setSyncState(pendingOps > 0 ? "syncing" : "synced");
      } catch (error) {
        console.error("Error checking sync queue:", error);
      }
    };

    // Check immediately and then every 60 seconds (increased from 30 seconds)
    checkSyncQueue();
    const interval = setInterval(checkSyncQueue, 60000);

    return () => clearInterval(interval);
  }, [user, isOnline]);

  // Update sync state when online status or user changes
  useEffect(() => {
    if (!user) {
      setSyncState("unauthenticated");
    } else if (!isOnline) {
      setSyncState("offline");
    } else if (pendingChanges > 0) {
      setSyncState("syncing");
    } else {
      setSyncState("synced");
    }
  }, [user, isOnline, pendingChanges]);

  if (!user) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 ${
              syncState === "offline"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : syncState === "syncing"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}
          >
            {syncState === "offline" && <CloudOff className="h-3 w-3" />}
            {syncState === "syncing" && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {syncState === "synced" && <Cloud className="h-3 w-3" />}

            <span className="text-xs">
              {syncState === "offline" && "Offline"}
              {syncState === "syncing" &&
                `Syncing${pendingChanges > 0 ? ` (${pendingChanges})` : ""}`}
              {syncState === "synced" && "Synced"}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {syncState === "offline" &&
            "You're offline. Changes will sync when you reconnect."}
          {syncState === "syncing" &&
            `Syncing ${pendingChanges} changes to the cloud.`}
          {syncState === "synced" && "All changes are synced to the cloud."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

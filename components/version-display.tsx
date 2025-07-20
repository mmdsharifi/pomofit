"use client";

import { useEffect, useState } from "react";
import { getVersionInfo, formatVersion, type VersionInfo } from "@/lib/version";

export default function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const info = getVersionInfo();
      setVersionInfo(info);
    } catch (error) {
      console.error("Error getting version info:", error);
      setVersionInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading || !versionInfo) {
    return null;
  }

  const formattedVersion = formatVersion(versionInfo);

  return (
    <div className="p-2 text-xs text-muted-foreground bg-muted/50 rounded border border-border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono">{formattedVersion}</span>
          <div className="flex gap-2 text-muted-foreground/70">
            <span>Build: {versionInfo.buildNumber}</span>
            <span>Changes: {versionInfo.changeCount}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-muted-foreground/70">
            v{versionInfo.version}
          </span>
          <span className="text-muted-foreground/50 text-[10px]">
            {versionInfo.commitHash}
          </span>
        </div>
      </div>
    </div>
  );
}

// Auto-versioning test comment

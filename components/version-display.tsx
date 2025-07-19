"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getVersionInfo, formatVersion, type VersionInfo } from "@/lib/version";
import { GitCommit, Calendar, Package } from "lucide-react";

export default function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get version info on component mount
    const info = getVersionInfo();
    setVersionInfo(info);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!versionInfo) {
    return null;
  }

  const formattedVersion = formatVersion(versionInfo);
  const buildDate = new Date(versionInfo.buildDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Card className="w-full border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Version Information
              </span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {formattedVersion}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Build Date: {buildDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <GitCommit className="h-3 w-3" />
              <span>Commit: {versionInfo.commitHash.substring(0, 8)}</span>
            </div>

            <div className="text-xs opacity-75">Semantic Versioning 2.0.0</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

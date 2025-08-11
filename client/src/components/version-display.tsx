import React, { useState, useEffect } from 'react';
import { getVersionInfo, formatVersionDisplay, type VersionInfo } from '../lib/version';

export function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Force refresh version info to avoid caching
    getVersionInfo().then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="text-xs text-muted-foreground text-center">
      {formatVersionDisplay(versionInfo)}
    </div>
  );
}

export function AdminVersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    getVersionInfo().then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
      <div className="font-medium text-center mb-2">System Information</div>
      <div className="grid grid-cols-2 gap-2">
        <div>Version: <span className="font-mono">{versionInfo.version}</span></div>
        <div>Build: <span className="font-mono">{versionInfo.hash}</span></div>
        <div>Environment: <span className="font-mono">{versionInfo.environment}</span></div>
        <div>Branch: <span className="font-mono">{versionInfo.branch}</span></div>
      </div>
      <div className="text-center pt-1 border-t">
        Built: {new Date(versionInfo.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
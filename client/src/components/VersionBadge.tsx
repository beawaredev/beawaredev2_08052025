import React, { useState, useEffect } from 'react';
import { getVersionInfo, formatVersionDisplay, type VersionInfo } from '../lib/version';

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Load version info on component mount
    getVersionInfo().then(info => {
      setVersionInfo(info);
    });
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="text-xs text-muted-foreground">
      {formatVersionDisplay(versionInfo)}
    </div>
  );
}
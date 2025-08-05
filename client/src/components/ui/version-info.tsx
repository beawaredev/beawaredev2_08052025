import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, GitBranch, Clock, Hash, Server } from 'lucide-react';
import { getVersionInfo, formatVersionDisplay, getShortVersion, type VersionInfo } from '@shared/version';

export function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    setVersionInfo(getVersionInfo());
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Info className="h-3 w-3 mr-1" />
            {getShortVersion(versionInfo)}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Version Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-medium">Version:</span>
                <Badge variant="secondary">{versionInfo.version}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="font-medium">Branch:</span>
                <Badge variant="outline">{versionInfo.branch}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-medium">Commit:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{versionInfo.hash}</code>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Built:</span>
                <span className="text-sm">{new Date(versionInfo.timestamp).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="font-medium">Environment:</span>
                <Badge variant={versionInfo.environment === 'production' ? 'default' : 'secondary'}>
                  {versionInfo.environment}
                </Badge>
              </div>
              
              {versionInfo.buildNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">Build:</span>
                  <span className="text-sm">#{versionInfo.buildNumber}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FooterVersion() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    setVersionInfo(getVersionInfo());
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="text-xs text-muted-foreground">
      {formatVersionDisplay(versionInfo)}
    </div>
  );
}

export function AdminVersionCard() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    setVersionInfo(getVersionInfo());
  }, []);

  if (!versionInfo) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">System Version</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Version:</span>
          <Badge variant="secondary">{versionInfo.version}</Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Commit:</span>
          <code className="text-xs">{versionInfo.hash}</code>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Environment:</span>
          <Badge variant={versionInfo.environment === 'production' ? 'default' : 'secondary'}>
            {versionInfo.environment}
          </Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Built:</span>
          <span className="text-xs">{new Date(versionInfo.timestamp).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
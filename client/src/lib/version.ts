// Simple version tracking without external dependencies
export interface VersionInfo {
  hash: string;
  timestamp: string;
  branch: string;
  version: string;
  environment: string;
  buildNumber?: string;
}

export function getVersionInfo(): VersionInfo {
  // Try to get version from build-time injection
  const buildInfo = (window as any).__VERSION_INFO__;
  if (buildInfo) {
    return buildInfo;
  }

  // Fallback to package.json version and current timestamp
  return {
    hash: 'dev',
    timestamp: new Date().toISOString(),
    branch: 'local',
    version: '1.1.0',
    environment: 'development'
  };
}

export function formatVersionDisplay(versionInfo: VersionInfo): string {
  const { hash, version, environment } = versionInfo;
  
  if (hash === 'dev') {
    return `v${version} (${environment})`;
  }
  
  const date = new Date(versionInfo.timestamp).toLocaleDateString();
  return `v${version} • ${hash} • ${date}`;
}

export function getShortVersion(versionInfo: VersionInfo): string {
  const { hash, version } = versionInfo;
  return hash === 'dev' ? `v${version}-dev` : `v${version}-${hash}`;
}
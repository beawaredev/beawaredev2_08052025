// Simple version tracking without external dependencies
export interface VersionInfo {
  hash: string;
  timestamp: string;
  branch: string;
  version: string;
  environment: string;
  build?: string;
}

let versionCache: VersionInfo | null = null;

export async function getVersionInfo(): Promise<VersionInfo> {
  // Return cached version if available
  if (versionCache) {
    return versionCache;
  }

  // Try to get version from build-time injection first
  const buildInfo = (window as any).__VERSION_INFO__;
  if (buildInfo) {
    versionCache = buildInfo;
    return buildInfo;
  }

  // Try to fetch from /version.json
  try {
    const response = await fetch('/version.json');
    if (response.ok) {
      const versionData = await response.json();
      versionCache = {
        version: versionData.version || '1.1.0',
        build: versionData.build || 'unknown',
        hash: versionData.hash || 'dev',
        branch: versionData.branch || 'local',
        timestamp: versionData.timestamp || new Date().toISOString(),
        environment: versionData.environment || 'development'
      };
      return versionCache;
    }
  } catch (error) {
    console.warn('Could not fetch version info from /version.json:', error);
  }

  // Fallback to default version info
  versionCache = {
    hash: 'dev',
    timestamp: new Date().toISOString(),
    branch: 'local',
    version: '1.1.0',
    environment: 'development',
    build: 'local'
  };
  
  return versionCache;
}

export function getVersionInfoSync(): VersionInfo {
  // Try to get version from build-time injection
  const buildInfo = (window as any).__VERSION_INFO__;
  if (buildInfo) {
    return buildInfo;
  }

  // Return cached version if available
  if (versionCache) {
    return versionCache;
  }

  // Fallback to default version info
  return {
    hash: 'dev',
    timestamp: new Date().toISOString(),
    branch: 'local',
    version: '1.1.0',
    environment: 'development',
    build: 'local'
  };
}

export function formatVersionDisplay(versionInfo: VersionInfo): string {
  const { hash, version, environment, build } = versionInfo;
  
  if (hash === 'dev') {
    return `BeAware • ${environment} • v${version} • build ${build || 'local'}`;
  }
  
  const date = new Date(versionInfo.timestamp).toLocaleDateString();
  return `BeAware • ${environment} • v${version} • build ${build || hash} • ${date}`;
}

export function getShortVersion(versionInfo: VersionInfo): string {
  const { hash, version, build } = versionInfo;
  return hash === 'dev' ? `v${version}-dev` : `v${version}-${build || hash}`;
}
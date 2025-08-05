// Version tracking system for BeAware.fyi
export interface VersionInfo {
  hash: string;
  timestamp: string;
  branch: string;
  version: string;
  environment: string;
  buildNumber?: string;
}

export function getVersionInfo(): VersionInfo {
  // Try to get version from environment variables (Azure deployment)
  const buildHash =
    process.env.GITHUB_SHA || process.env.BUILD_SOURCEVERSION || "dev";
  const buildRef =
    process.env.GITHUB_REF ||
    process.env.BUILD_SOURCEBRANCH ||
    "refs/heads/main";
  const buildNumber =
    process.env.GITHUB_RUN_NUMBER || process.env.BUILD_BUILDNUMBER;

  // Extract branch name from ref
  const branch = buildRef.replace("refs/heads/", "").replace("refs/tags/", "");

  // Determine environment
  let environment = "development";
  if (process.env.NODE_ENV === "production") {
    environment = "production";
  } else if (process.env.AZURE_FUNCTIONS_ENVIRONMENT) {
    environment = "azure";
  } else if (process.env.REPL_ID) {
    environment = "replit";
  }

  return {
    hash: buildHash.substring(0, 8), // Short hash
    timestamp: new Date().toISOString(),
    branch,
    version: "1.1.0",
    environment,
    buildNumber,
  };
}

export function formatVersionDisplay(versionInfo: VersionInfo): string {
  const { hash, version, environment } = versionInfo;

  if (hash === "dev") {
    return `v${version} (${environment})`;
  }

  const date = new Date(versionInfo.timestamp).toLocaleDateString();
  return `v${version} • ${hash} • ${date}`;
}

export function getShortVersion(versionInfo: VersionInfo): string {
  const { hash, version } = versionInfo;
  return hash === "dev" ? `v${version}-dev` : `v${version}-${hash}`;
}

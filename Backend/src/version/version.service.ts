import { Injectable } from "@nestjs/common";
import backendPackage from "../../package.json";

export type BackendVersionInfo = {
  name: string;
  description: string;
  version: string;
  semver: {
    major: number;
    minor: number;
    patch: number;
    prerelease: string | null;
  };
  apiVersion: string;
  buildDate: string;
};

type PackageLike = {
  name?: string;
  version?: string;
  description?: string;
};

@Injectable()
export class VersionService {
  private readonly bootTimestamp = new Date().toISOString();
  private readonly packageInfo: PackageLike = backendPackage as PackageLike;

  private sanitizeVersion(raw?: string): string {
    if (raw && typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return "0.0.0";
  }

  private parseSemver(version: string): BackendVersionInfo["semver"] {
    const fallback = { major: 0, minor: 0, patch: 0, prerelease: null };
    if (!version) {
      return fallback;
    }
    const semverMatch = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/);
    if (!semverMatch) {
      return fallback;
    }
    const [, major = "0", minor = "0", patch = "0", prerelease = null] = semverMatch;
    return {
      major: Number.parseInt(major, 10) || 0,
      minor: Number.parseInt(minor, 10) || 0,
      patch: Number.parseInt(patch, 10) || 0,
      prerelease: prerelease ?? null,
    };
  }

  private resolveVersionString(): string {
    const envOverride = process.env.BACKEND_VERSION ?? process.env.APP_VERSION;
    if (envOverride) {
      return this.sanitizeVersion(envOverride);
    }
    return this.sanitizeVersion(this.packageInfo.version);
  }

  getBackendVersion(): BackendVersionInfo {
    const version = this.resolveVersionString();
    return {
      name: this.packageInfo.name ?? "backend",
      description: this.packageInfo.description ?? "",
      version,
      semver: this.parseSemver(version),
      apiVersion: "v1",
      buildDate: this.bootTimestamp,
    };
  }
}

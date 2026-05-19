import { Injectable } from "@nestjs/common";
import backendPackage from "../../package.json";

/**
 * Define el tipo backend version info utilizado por el backend.
 */
export type BackendVersionInfo = {
  /**
   * Campo de datos asociado a `name`.
   */
  name: string;
  /**
   * Campo de datos asociado a `description`.
   */
  description: string;
  /**
   * Campo de datos asociado a `version`.
   */
  version: string;
  /**
   * Campo de datos asociado a `semver`.
   */
  semver: {
    major: number;
    minor: number;
    patch: number;
    prerelease: string | null;
  };
  /**
   * Campo de datos asociado a `apiVersion`.
   */
  apiVersion: string;
  /**
   * Campo de datos asociado a `buildDate`.
   */
  buildDate: string;
};

/**
 * Define el tipo package like utilizado por el backend.
 */
type PackageLike = {
  /**
   * Campo de datos asociado a `name`.
   */
  name?: string;
  /**
   * Campo de datos asociado a `version`.
   */
  version?: string;
  /**
   * Campo de datos asociado a `description`.
   */
  description?: string;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio version.
 */
@Injectable()
export class VersionService {
  private readonly bootTimestamp = new Date().toISOString();
  private readonly packageInfo: PackageLike = backendPackage as PackageLike;

  /**
   * Sanitize version.
   * @param raw Valor del parámetro `raw`.
   * @returns Resultado de la operación.
   */
  private sanitizeVersion(raw?: string): string {
    if (raw && typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return "0.0.0";
  }

  /**
   * Interpreta semver.
   * @param version Valor del parámetro `version`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseSemver(version: string): BackendVersionInfo["semver"] {
    const fallback = { major: 0, minor: 0, patch: 0, prerelease: null };
    if (!version) {
      return fallback;
    }
    const semverMatch = version.match(
      /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/,
    );
    if (!semverMatch) {
      return fallback;
    }
    const [, major = "0", minor = "0", patch = "0", prerelease = null] =
      semverMatch;
    return {
      major: Number.parseInt(major, 10) || 0,
      minor: Number.parseInt(minor, 10) || 0,
      patch: Number.parseInt(patch, 10) || 0,
      prerelease: prerelease ?? null,
    };
  }

  /**
   * Resuelve version string.
   * @returns Resultado de la operación.
   */
  private resolveVersionString(): string {
    const envOverride = process.env.BACKEND_VERSION ?? process.env.APP_VERSION;
    if (envOverride) {
      return this.sanitizeVersion(envOverride);
    }
    return this.sanitizeVersion(this.packageInfo.version);
  }

  /**
   * Get backend version.
   * @returns Resultado de la consulta solicitada.
   */
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

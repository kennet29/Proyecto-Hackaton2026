import { QueryFailedError } from "typeorm";

const unavailableCodes = new Set([
  "ETIMEOUT",
  "ESOCKET",
  "ECONNRESET",
  "ENOTFOUND",
  "ELOGIN",
]);

/**
 * Indica si el error representa indisponibilidad temporal de SQL Server.
 * @param error Error original.
 * @returns `true` cuando la base no se pudo alcanzar o no respondió a tiempo.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  const queryError = error instanceof QueryFailedError ? error : null;
  const driverError =
    queryError &&
    typeof queryError.driverError === "object" &&
    queryError.driverError !== null
      ? (queryError.driverError as {
          code?: string;
          name?: string;
          message?: string;
          originalError?: {
            code?: string;
            name?: string;
            message?: string;
          };
        })
      : null;
  const code = driverError?.code ?? driverError?.originalError?.code;
  const name = driverError?.name ?? driverError?.originalError?.name;
  const message = [
    queryError?.message,
    driverError?.message,
    driverError?.originalError?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    unavailableCodes.has(code ?? "") ||
    name === "TimeoutError" ||
    message.includes("operation timed out") ||
    message.includes("timeout") ||
    message.includes("failed to connect")
  );
}

import { QueryFailedError } from "typeorm";
import { isDatabaseUnavailable } from "./database-error.util";

const queryFailedError = (driverError: unknown) =>
  new QueryFailedError("SELECT 1", [], driverError);

describe("isDatabaseUnavailable", () => {
  it("detects unavailable SQL Server error codes", () => {
    expect(isDatabaseUnavailable(queryFailedError({ code: "ETIMEOUT" }))).toBe(
      true,
    );
    expect(
      isDatabaseUnavailable(
        queryFailedError({ originalError: { code: "ECONNRESET" } }),
      ),
    ).toBe(true);
  });

  it("detects timeout names and messages", () => {
    expect(isDatabaseUnavailable(queryFailedError({ name: "TimeoutError" }))).toBe(
      true,
    );
    expect(
      isDatabaseUnavailable(
        queryFailedError({ message: "Failed to connect to SQL Server" }),
      ),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isDatabaseUnavailable(new Error("validation failed"))).toBe(false);
    expect(isDatabaseUnavailable(queryFailedError({ code: "EREQUEST" }))).toBe(
      false,
    );
  });
});

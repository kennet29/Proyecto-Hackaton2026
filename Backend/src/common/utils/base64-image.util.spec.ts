/**
 * @file Backend/src/common/utils/base64-image.util.spec.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException } from "@nestjs/common";
import { decodeBase64Image, validateImageMimeType } from "./base64-image.util";

describe("base64 image utilities", () => {
  describe("decodeBase64Image", () => {
    it("preserves undefined and null inputs", () => {
      expect(decodeBase64Image(undefined, "foto")).toBeUndefined();
      expect(decodeBase64Image(null, "foto")).toBeNull();
    });

    it("decodes plain base64 payloads", () => {
      const encoded = Buffer.from("hello").toString("base64");

      expect(decodeBase64Image(encoded, "foto")?.toString("utf8")).toBe(
        "hello",
      );
    });

    it("decodes data uri payloads", () => {
      const encoded = Buffer.from("image-data").toString("base64");

      expect(
        decodeBase64Image(`data:image/png;base64,${encoded}`, "foto")?.toString(
          "utf8",
        ),
      ).toBe("image-data");
    });

    it("rejects invalid base64 payloads", () => {
      expect(() => decodeBase64Image("not base64!", "foto")).toThrow(
        BadRequestException,
      );
    });
  });

  describe("validateImageMimeType", () => {
    it("normalizes valid image mime types", () => {
      expect(validateImageMimeType(" Image/PNG ", "mime")).toBe("image/png");
    });

    it("preserves empty-ish inputs as nullish values", () => {
      expect(validateImageMimeType(undefined, "mime")).toBeUndefined();
      expect(validateImageMimeType(null, "mime")).toBeNull();
      expect(validateImageMimeType("   ", "mime")).toBeNull();
    });

    it("rejects non-image mime types", () => {
      expect(() => validateImageMimeType("application/pdf", "mime")).toThrow(
        BadRequestException,
      );
    });
  });
});

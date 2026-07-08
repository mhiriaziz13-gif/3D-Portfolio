import { createHash, randomBytes } from "crypto";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const sha256Hex = (value: string) => createHash("sha256").update(value).digest("hex");

export const hashNullable = (value: string | null | undefined) =>
  value ? sha256Hex(value) : null;
import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "p1_";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const DEVELOPMENT_FALLBACK_SECRET = "local-dev-student-route-secret";

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;

  return Buffer.from(normalizedValue + "=".repeat(paddingLength), "base64");
}

function getStudentRouteSecret() {
  const configuredSecret = process.env.STUDENT_ROUTE_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_FALLBACK_SECRET;
  }

  throw new Error("STUDENT_ROUTE_SECRET is not set.");
}

function getEncryptionKey() {
  return createHash("sha256").update(getStudentRouteSecret()).digest();
}

export function encodeStudentRouteId(studentId: number) {
  if (!Number.isInteger(studentId) || studentId <= 0) {
    throw new Error("Student ID must be a positive integer.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encryptedValue = Buffer.concat([
    cipher.update(String(studentId), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}${toBase64Url(Buffer.concat([iv, authTag, encryptedValue]))}`;
}

export function decodeStudentRouteId(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  try {
    const payload = fromBase64Url(token.slice(TOKEN_PREFIX.length));

    if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedValue = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);

    decipher.setAuthTag(authTag);

    const decryptedValue = Buffer.concat([
      decipher.update(encryptedValue),
      decipher.final(),
    ]).toString("utf8");
    const studentId = Number(decryptedValue);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return null;
    }

    return studentId;
  } catch {
    return null;
  }
}

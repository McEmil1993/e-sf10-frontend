import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "p1_";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const DEVELOPMENT_FALLBACK_SECRET = "local-dev-pupil-route-secret";

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

function getPupilRouteSecret() {
  const configuredSecret = process.env.PUPIL_ROUTE_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_FALLBACK_SECRET;
  }

  throw new Error("PUPIL_ROUTE_SECRET is not set.");
}

function getEncryptionKey() {
  return createHash("sha256").update(getPupilRouteSecret()).digest();
}

export function encodePupilRouteId(pupilId: number) {
  if (!Number.isInteger(pupilId) || pupilId <= 0) {
    throw new Error("Pupil ID must be a positive integer.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encryptedValue = Buffer.concat([
    cipher.update(String(pupilId), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}${toBase64Url(Buffer.concat([iv, authTag, encryptedValue]))}`;
}

export function decodePupilRouteId(token: string) {
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
    const pupilId = Number(decryptedValue);

    if (!Number.isInteger(pupilId) || pupilId <= 0) {
      return null;
    }

    return pupilId;
  } catch {
    return null;
  }
}

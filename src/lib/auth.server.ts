import { SignJWT, jwtVerify } from "jose";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { sql } from "./db.server";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "fallback_default_secret_for_signing_jwt";
const secretKey = new TextEncoder().encode(ADMIN_SECRET);

// Custom PBKDF2-SHA256 password hashing for edge runtime compatibility
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derivedKey)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2_sha256$100000$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const hashHex = parts[3];

    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      baseKey,
      256
    );

    const currentHashHex = Array.from(new Uint8Array(derivedKey)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return currentHashHex === hashHex;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { email: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function loginAdmin(email: string, password: string): Promise<string> {
  const result = await sql`SELECT * FROM admins WHERE email = ${email}`;
  if (result.length === 0) {
    throw new Error("Invalid credentials");
  }
  const admin = result[0];
  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }
  return createAdminSession(email);
}

// Server middleware to protect endpoints
export const requireNeonAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No admin session token provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = await verifyAdminSession(token);
    if (!admin) {
      throw new Error("Unauthorized: Invalid session token");
    }

    return next({
      context: {
        admin,
      },
    });
  }
);

"use client";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface PinHashPayload {
  hash: string;
  salt: string;
  iterations: number;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export async function derivePinHash(
  pin: string,
  salt?: Uint8Array,
  iterations = 210000
): Promise<PinHashPayload> {
  const normalizedSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: normalizedSalt as unknown as BufferSource,
      iterations
    },
    material,
    256
  );
  return {
    hash: toBase64(new Uint8Array(bits)),
    salt: toBase64(normalizedSalt),
    iterations
  };
}

export async function verifyPin(
  pin: string,
  payload: PinHashPayload | null | undefined
): Promise<boolean> {
  if (!payload) return false;
  const derived = await derivePinHash(pin, fromBase64(payload.salt), payload.iterations);
  return derived.hash === payload.hash;
}

export async function encryptText(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      iterations: 250000
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    encoder.encode(plaintext)
  );
  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    salt: toBase64(salt)
  };
}

export async function decryptText(
  ciphertext: string,
  iv: string,
  salt: string,
  passphrase: string
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromBase64(salt) as unknown as BufferSource,
      iterations: 250000
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) as unknown as BufferSource },
    key,
    fromBase64(ciphertext) as unknown as BufferSource
  );
  return decoder.decode(decrypted);
}

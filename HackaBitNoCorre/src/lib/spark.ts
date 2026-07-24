/**
 * Breez SDK Spark — real Lightning wallet integration.
 * Self-custodial, nodeless. Keys held locally, balance is real BTC.
 */

import type {
  BreezSdk,
  GetInfoResponse,
  Payment,
  InputType,
  PrepareSendPaymentResponse,
  PrepareLnurlPayResponse,
  LnurlPayRequestDetails,
} from "@breeztech/breez-sdk-spark/web";

// ── State ────────────────────────────────────────────────────────

let sdk: BreezSdk | null = null;
let initPromise: Promise<BreezSdk> | null = null;

const STORAGE_KEY = "spark_mnemonic";
const API_KEY_STORAGE = "spark_breez_api_key";
const NETWORK = "mainnet" as const;

// ── Mnemonic management ──────────────────────────────────────────

import { generateMnemonic as bip39Generate, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

function generateMnemonic(): string {
  return bip39Generate(wordlist, 128);
}

function isValidMnemonic(mnemonic: string): boolean {
  try {
    return validateMnemonic(mnemonic, wordlist);
  } catch {
    return false;
  }
}

export function getStoredMnemonic(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeMnemonic(mnemonic: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, mnemonic);
  } catch {
    // ignore
  }
}

export function hasWallet(): boolean {
  return getStoredMnemonic() !== null;
}

// ── API key management ───────────────────────────────────────────

export function getApiKey(): string | null {
  const envKey = import.meta.env.VITE_BREEZ_API_KEY as string | undefined;
  if (envKey && envKey.trim()) return envKey.trim();
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function storeApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

// ── Initialization ───────────────────────────────────────────────

export async function initSpark(): Promise<BreezSdk> {
  if (sdk) return sdk;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = await import("@breeztech/breez-sdk-spark/web");
    await mod.default();

    let mnemonic = getStoredMnemonic();
    if (!mnemonic || !isValidMnemonic(mnemonic)) {
      mnemonic = generateMnemonic();
      storeMnemonic(mnemonic);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("BREEZ_API_KEY_MISSING");
    }

    const config = mod.defaultConfig(NETWORK);
    config.apiKey = apiKey;

    const instance = await mod.connect({
      config,
      seed: { type: "mnemonic" as const, mnemonic, passphrase: undefined },
      storageDir: "spark-wallet",
    });

    sdk = instance;
    return instance;
  })();

  return initPromise;
}

export function getSdk(): BreezSdk | null {
  return sdk;
}

// ── Wallet info ──────────────────────────────────────────────────

export async function getWalletInfo(
  ensureSynced = false,
): Promise<GetInfoResponse> {
  const s = await initSpark();
  return s.getInfo({ ensureSynced });
}

export async function getBalance(): Promise<number> {
  const info = await getWalletInfo(false);
  return info.balanceSats;
}

// ── Payments list ─────────────────────────────────────────────────

export async function listPayments(): Promise<Payment[]> {
  const s = await initSpark();
  const res = await s.listPayments({});
  return res.payments;
}

// ── Parse input ───────────────────────────────────────────────────

export async function parseInput(input: string): Promise<InputType> {
  const s = await initSpark();
  return s.parse(input.trim());
}

// ── Receive payment (generate BOLT11 invoice) ─────────────────────

export async function receiveBolt11Invoice(
  amountSats: number,
  description: string,
): Promise<{ invoice: string; fee: bigint }> {
  const s = await initSpark();
  const res = await s.receivePayment({
    paymentMethod: {
      type: "bolt11Invoice",
      description,
      amountSats,
      expirySecs: 3600,
      paymentHash: undefined,
    },
  });
  return { invoice: res.paymentRequest, fee: res.fee };
}

// ── Receive: static Spark address (no expiry, no amount) ──────────

export async function getSparkAddress(): Promise<string> {
  const s = await initSpark();
  const res = await s.receivePayment({
    paymentMethod: { type: "sparkAddress" },
  });
  return res.paymentRequest;
}

// ── Receive: on-chain Bitcoin deposit address ──────────────────────

export async function getBitcoinAddress(): Promise<string> {
  const s = await initSpark();
  const res = await s.receivePayment({
    paymentMethod: { type: "bitcoinAddress", newAddress: true },
  });
  return res.paymentRequest;
}

// ── Send payment ───────────────────────────────────────────────────

export async function prepareSendPayment(
  paymentRequest: string,
  amountSats?: number,
): Promise<PrepareSendPaymentResponse> {
  const s = await initSpark();
  return s.prepareSendPayment({
    paymentRequest: { type: "input", input: paymentRequest.trim() },
    amount: amountSats ? BigInt(amountSats) : undefined,
  });
}

export async function sendPayment(
  prepareResponse: PrepareSendPaymentResponse,
): Promise<Payment> {
  const s = await initSpark();
  const res = await s.sendPayment({ prepareResponse });
  return res.payment;
}

// ── LNURL-Pay ──────────────────────────────────────────────────────

export async function prepareLnurlPay(
  payRequest: LnurlPayRequestDetails,
  amountSats: number,
  comment?: string,
): Promise<PrepareLnurlPayResponse> {
  const s = await initSpark();
  return s.prepareLnurlPay({
    amount: BigInt(amountSats),
    comment,
    payRequest,
  });
}

export async function lnurlPay(
  prepareResponse: PrepareLnurlPayResponse,
): Promise<Payment> {
  const s = await initSpark();
  const res = await s.lnurlPay({ prepareResponse });
  return res.payment;
}

// ── Event listener ─────────────────────────────────────────────────

export async function addEventListener(
  onEvent: (e: { type: string }) => void,
): Promise<string> {
  const s = await initSpark();
  return s.addEventListener({ onEvent });
}

// ── Export mnemonic ────────────────────────────────────────────────

export function exportMnemonic(): string | null {
  return getStoredMnemonic();
}

// ── Reset wallet (dangerous) ───────────────────────────────────────

export async function resetWallet(): Promise<void> {
  if (sdk) {
    try {
      await sdk.disconnect();
    } catch {
      // ignore
    }
    sdk = null;
  }
  initPromise = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

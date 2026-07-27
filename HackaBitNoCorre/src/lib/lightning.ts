/**
 * Lightning Network payment utilities.
 * Real BOLT11 invoice fetching via LNURL-pay, WebLN support, and BOLT11 parsing.
 */

export type LNURLPayParams = {
  callback: string;
  minSendable: number; // msat
  maxSendable: number; // msat
  metadata: string;
  commentAllowed?: number;
  tag: string;
};

export type InvoiceResult = {
  pr: string; // BOLT11 invoice
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
};

// ── Lightning Address / LNURL-pay resolution ──────────────────────

export async function resolveLightningAddress(
  address: string,
): Promise<LNURLPayParams> {
  const [user, domain] = address.trim().split("@");
  if (!user || !domain) throw new Error("Endereço Lightning inválido. Use formato usuario@dominio.com");
  const url = `https://${domain}/.well-known/lnurlp/${user}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Provedor respondeu ${res.status}`);
  const data = (await res.json()) as LNURLPayParams | { status: string; reason: string };
  if ("status" in data && data.status === "ERROR")
    throw new Error(data.reason || "Erro do provedor");
  if (!("callback" in data)) throw new Error("Provedor não suporta LNURL-pay");
  return data as LNURLPayParams;
}

export async function fetchInvoiceFromLNURL(
  params: LNURLPayParams,
  amountSats: number,
  comment?: string,
): Promise<string> {
  const amountMsat = amountSats * 1000;
  if (amountMsat < params.minSendable)
    throw new Error(`Valor mínimo: ${Math.ceil(params.minSendable / 1000)} sats`);
  if (amountMsat > params.maxSendable)
    throw new Error(`Valor máximo: ${Math.floor(params.maxSendable / 1000)} sats`);

  const url = new URL(params.callback);
  url.searchParams.set("amount", String(amountMsat));
  if (comment && params.commentAllowed && params.commentAllowed > 0) {
    url.searchParams.set("comment", comment.slice(0, params.commentAllowed));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Provedor respondeu ${res.status}`);
  const data = (await res.json()) as InvoiceResult | { status: string; reason: string };
  if ("status" in data && data.status === "ERROR")
    throw new Error(data.reason || "Erro ao gerar invoice");
  if (!("pr" in data) || !data.pr) throw new Error("Provedor não retornou invoice");
  return data.pr;
}

export async function getInvoiceFromLightningAddress(
  address: string,
  amountSats: number,
  comment?: string,
): Promise<string> {
  const params = await resolveLightningAddress(address);
  return fetchInvoiceFromLNURL(params, amountSats, comment);
}

// ── LNURL bech32 decoding ────────────────────────────────────────

function bech32Decode(str: string): { hrp: string; data: number[] } | null {
  const charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const lower = str.toLowerCase();
  const pos = lower.lastIndexOf("1");
  if (pos < 1 || pos + 7 > lower.length) return null;
  const hrp = lower.slice(0, pos);
  const dataPart = lower.slice(pos + 1);
  const data: number[] = [];
  for (const c of dataPart) {
    const v = charset.indexOf(c);
    if (v === -1) return null;
    data.push(v);
  }
  return { hrp, data: data.slice(0, -6) }; // strip checksum
}

function convertBits(
  data: number[],
  fromBits: number,
  toBits: number,
  pad: boolean,
): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const v of data) {
    if (v < 0 || v >> fromBits !== 0) return [];
    acc = (acc << fromBits) | v;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) {
    ret.push((acc << (toBits - bits)) & maxv);
  }
  return ret;
}

export function decodeLNURL(lnurl: string): string | null {
  const decoded = bech32Decode(lnurl.trim());
  if (!decoded) return null;
  const bytes = convertBits(decoded.data, 5, 8, false);
  if (!bytes.length) return null;
  return bytes.map((b) => String.fromCharCode(b)).join("");
}

// ── Resolve any pay target (LNURL, address, URL) ─────────────────

export async function resolvePayTarget(input: string): Promise<LNURLPayParams> {
  const trimmed = input.trim();

  if (trimmed.includes("@")) {
    return resolveLightningAddress(trimmed);
  }

  if (trimmed.toUpperCase().startsWith("LNURL1")) {
    const url = decodeLNURL(trimmed);
    if (!url) throw new Error("LNURL inválido");
    const res = await fetch(url);
    const data = (await res.json()) as LNURLPayParams | { status: string; reason: string };
    if ("status" in data && data.status === "ERROR")
      throw new Error(data.reason || "Erro do provedor");
    return data as LNURLPayParams;
  }

  if (trimmed.startsWith("http")) {
    const res = await fetch(trimmed);
    const data = (await res.json()) as LNURLPayParams | { status: string; reason: string };
    if ("status" in data && data.status === "ERROR")
      throw new Error(data.reason || "Erro do provedor");
    return data as LNURLPayParams;
  }

  throw new Error("Formato não reconhecido. Use BOLT11, LNURL ou endereço Lightning.");
}

// ── BOLT11 invoice parsing ────────────────────────────────────────

export function isBolt11(invoice: string): boolean {
  return /^lnbc\d/i.test(invoice.trim().toLowerCase());
}

export function parseBolt11Amount(invoice: string): number | null {
  const match = invoice.trim().toLowerCase().match(/^lnbc(\d+)([munp]?)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const mult = match[2] || "";
  const multipliers: Record<string, number> = {
    "": 100_000_000, // BTC
    m: 100_000, // milli-BTC
    u: 100, // micro-BTC
    n: 0.1, // nano-BTC
    p: 0.0001, // pico-BTC
  };
  return Math.round(num * (multipliers[mult] ?? 0));
}

export function parseBolt11Description(invoice: string): string | null {
  const match = invoice.match(/d\s*(\d+)/);
  if (!match) return null;
  // Simplified: look for 'd' short description tag
  // Full BOLT11 decoding is complex; this is a best-effort extraction
  return null;
}

// ── Deep link ───────────────────────────────────────────────────

export function toDeepLink(invoice: string): string {
  const trimmed = invoice.trim();
  if (trimmed.startsWith("lightning:")) return trimmed;
  return `lightning:${trimmed}`;
}

// ── WebLN ────────────────────────────────────────────────────────

type WebBlnRequest = {
  amount: number;
  defaultMemo?: string;
};

type WebBlnInvoice = {
  paymentRequest: string;
};

type WebBlnPaymentResult = {
  preimage: string;
};

type WebBln = {
  enabled?: boolean;
  enable(): Promise<void>;
  makeInvoice(req: WebBlnRequest): Promise<WebBlnInvoice>;
  sendPayment(pr: string): Promise<WebBlnPaymentResult>;
};

declare global {
  interface Window {
    webln?: WebBln;
  }
}

export function isWebLNAvailable(): boolean {
  return typeof window !== "undefined" && !!window.webln;
}

export async function enableWebLN(): Promise<void> {
  if (!window.webln) throw new Error("WebLN não encontrada");
  await window.webln.enable();
}

export async function makeWebLNInvoice(
  amountSats: number,
  memo?: string,
): Promise<string> {
  if (!window.webln) throw new Error("WebLN não encontrada");
  if (!window.webln.enabled) await window.webln.enable();
  const result = await window.webln.makeInvoice({
    amount: amountSats,
    defaultMemo: memo,
  });
  return result.paymentRequest;
}

export async function sendWebLNPayment(pr: string): Promise<string> {
  if (!window.webln) throw new Error("WebLN não encontrada");
  if (!window.webln.enabled) await window.webln.enable();
  const result = await window.webln.sendPayment(pr);
  return result.preimage;
}

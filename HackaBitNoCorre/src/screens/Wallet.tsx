import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Shield,
  Zap,
  Globe,
  ClipboardPaste,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { useSparkWallet } from "@/lib/spark-hooks";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";
import { useToast } from "@/components/ui/Toast";
import { SAT, formatAmount } from "@/lib/format";
import {
  receiveBolt11Invoice,
  getSparkAddress,
  getBitcoinAddress,
  prepareSendPayment,
  sendPayment,
  parseInput,
  exportMnemonic,
  storeApiKey,
} from "@/lib/spark";
import {
  isWebLNAvailable,
  makeWebLNInvoice,
  sendWebLNPayment,
} from "@/lib/lightning";
import type { Payment, InputType } from "@breeztech/breez-sdk-spark/web";

export function WalletScreen() {
  const { ready, balanceSats, payments, loading, error, needsApiKey, refetch } = useSparkWallet();
  const { profile } = useAuth();
  const { push } = useToast();
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  const age = profile?.birthdate
    ? (() => {
        const today = new Date();
        const birth = new Date(profile.birthdate);
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
        return a;
      })()
    : null;
  const isUnder16 = age !== null && age < 16;

  if (loading && !ready && !needsApiKey) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-44 mb-6" />
      </div>
    );
  }

  if (needsApiKey || (error && !ready)) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <ApiKeySetup
          error={needsApiKey ? null : error}
          onSaved={() => { refetch(); }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="text-xl font-bold text-[var(--color-fg)] mb-1">Carteira</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-6">
        Bitcoin real, autocustodial
      </p>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(circle at top right, var(--color-primary), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-[var(--color-fg-muted)]">Saldo real</p>
              <Sparkles size={14} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[var(--color-primary)]">{SAT}</span>
              <span className="text-4xl font-bold text-gradient-gold tabular-nums">
                {formatAmount(balanceSats)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-fg-subtle)] mt-2">
              Bitcoin na rede Lightning via Spark
            </p>

            <div className="flex gap-3 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setShowReceive(true)}>
                <ArrowDownToLine size={16} /> Receber
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => isUnder16 ? push("info", "Envio disponível apenas para maiores de 16 anos.") : setShowSend(true)}
              >
                <ArrowUpFromLine size={16} /> Enviar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Security note */}
      <Card className="p-3 mb-4 flex items-center gap-2">
        <Shield size={16} className="text-[var(--color-secondary)] shrink-0" />
        <p className="text-xs text-[var(--color-fg-muted)] flex-1">
          Carteira autocustodial. Suas chaves, seu Bitcoin.
        </p>
        <button
          onClick={() => setShowSeed(true)}
          className="text-xs text-[var(--color-primary)] font-medium inline-flex items-center gap-1 shrink-0"
        >
          <KeyRound size={14} /> Backup
        </button>
      </Card>

      {/* Transactions */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">Histórico</h2>
      {payments.length === 0 ? (
        <EmptyState
          emoji=""
          title="Sem transações ainda"
          description="Receba seu primeiro Bitcoin para ver aqui."
          action={<div className="mt-2"><Mascot size={48} expression="curious" /></div>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {payments.map((tx) => (
            <SparkTxRow key={tx.id} tx={tx} />
          ))}
        </ul>
      )}

      {/* Receive modal */}
      {showReceive && (
        <ReceiveModal onClose={() => setShowReceive(false)} />
      )}

      {/* Send modal */}
      {showSend && !isUnder16 && (
        <SendModal
          onClose={() => setShowSend(false)}
          maxAmount={balanceSats}
          onSent={() => { refetch(); push("success", "Pagamento enviado!"); }}
        />
      )}

      {/* Seed backup modal */}
      {showSeed && (
        <SeedModal onClose={() => setShowSeed(false)} />
      )}
    </div>
  );
}

// ── QR Code hook ─────────────────────────────────────────────────

function useQRCode(value: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!value) { setUrl(null); return; }
    QRCode.toDataURL(value, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((u) => { if (!cancelled) setUrl(u); })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [value]);
  return url;
}

// ── Receive modal with 3 methods ─────────────────────────────────

type ReceiveMethod = "spark-address" | "spark-invoice" | "bitcoin" | "webln" | "paste-invoice";

function ReceiveModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<ReceiveMethod>("spark-address");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-5" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-bold text-[var(--color-fg)] mb-4 text-center">Receber Bitcoin</h3>

        {/* Method selector */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          <MethodTab
            active={method === "spark-address"}
            onClick={() => setMethod("spark-address")}
            icon={<Zap size={14} />}
            label="Spark"
            recommended
          />
          <MethodTab
            active={method === "spark-invoice"}
            onClick={() => setMethod("spark-invoice")}
            icon={<Zap size={14} />}
            label="Invoice"
          />
          <MethodTab
            active={method === "bitcoin"}
            onClick={() => setMethod("bitcoin")}
            icon={<ArrowDownToLine size={14} />}
            label="Bitcoin"
          />
          <MethodTab
            active={method === "webln"}
            onClick={() => setMethod("webln")}
            icon={<Globe size={14} />}
            label="WebLN"
          />
          <MethodTab
            active={method === "paste-invoice"}
            onClick={() => setMethod("paste-invoice")}
            icon={<ClipboardPaste size={14} />}
            label="Colar"
          />
        </div>

        {method === "spark-address" && <SparkAddressForm />}
        {method === "spark-invoice" && <SparkInvoiceForm />}
        {method === "bitcoin" && <BitcoinAddressForm />}
        {method === "webln" && <WebLNReceiveForm />}
        {method === "paste-invoice" && <PasteInvoiceForm />}

        <Button fullWidth variant="ghost" size="sm" onClick={onClose} className="mt-3">
          Fechar
        </Button>
      </motion.div>
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  icon,
  label,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-[var(--radius-md)] border text-xs font-medium transition-colors relative ${
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]"
          : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)]"
      }`}
    >
      {recommended && (
        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-[var(--color-secondary)] text-[var(--color-secondary-fg)] px-1.5 py-0.5 rounded-full leading-none">
          RECOMENDADO
        </span>
      )}
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Method 1: Spark SDK BOLT11 Invoice ────────────────────────────

// ── Method 0: Static Spark Address ───────────────────────────────

function SparkAddressForm() {
  const { push } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrUrl = useQRCode(address);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const addr = await getSparkAddress();
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar endereço Spark.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { push("error", "Não foi possível copiar."); }
  };

  if (address) {
    return (
      <div>
        <QRDisplay url={qrUrl} />
        <p className="text-xs text-[var(--color-fg-subtle)] text-center mb-3 break-all line-clamp-3">
          {address}
        </p>
        <Button fullWidth variant="secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar endereço"}
        </Button>
        <p className="text-xs text-[var(--color-fg-muted)] text-center mt-3">
          Endereço Spark permanente. Qualquer carteira Spark pode enviar a qualquer momento, sem expiração.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--color-fg-muted)] text-center">
        Gere um endereço Spark permanente para receber Bitcoin de outras carteiras Spark. Não expira e aceita qualquer valor.
      </p>
      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <Button fullWidth size="lg" loading={loading} onClick={handleGenerate}>
        <Zap size={18} /> Gerar endereço Spark
      </Button>
    </div>
  );
}

// ── Method 0b: On-chain Bitcoin deposit ──────────────────────────

function BitcoinAddressForm() {
  const { push } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrUrl = useQRCode(address ? `bitcoin:${address}` : null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const addr = await getBitcoinAddress();
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar endereço Bitcoin.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { push("error", "Não foi possível copiar."); }
  };

  if (address) {
    return (
      <div>
        <QRDisplay url={qrUrl} />
        <p className="text-xs text-[var(--color-fg-subtle)] text-center mb-3 break-all">
          {address}
        </p>
        <Button fullWidth variant="secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar endereço"}
        </Button>
        <p className="text-xs text-[var(--color-fg-muted)] text-center mt-3">
          Endereço Bitcoin on-chain. Envie BTC da qualquer carteira Bitcoin. O saldo aparece na carteira após a confirmação na rede.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--color-fg-muted)] text-center">
        Gere um endereço Bitcoin on-chain para depositar BTC da any carteira Bitcoin. O saldo é creditado após 1 confirmação.
      </p>
      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <Button fullWidth size="lg" loading={loading} onClick={handleGenerate}>
        <ArrowDownToLine size={18} /> Gerar endereço Bitcoin
      </Button>
    </div>
  );
}

// ── Method 1: Spark BOLT11 Invoice ───────────────────────────────

function SparkInvoiceForm() {
  const { push } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrUrl = useQRCode(invoice ? `lightning:${invoice}` : null);

  const handleGenerate = async () => {
    setError(null);
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { setError("Digite um valor em sats."); return; }
    setLoading(true);
    try {
      const result = await receiveBolt11Invoice(amt, description || "Receber Bitcoin");
      setInvoice(result.invoice);
      push("success", "Invoice gerada!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { push("error", "Não foi possível copiar."); }
  };

  if (invoice) {
    return (
      <div>
        <QRDisplay url={qrUrl} />
        <p className="text-xs text-[var(--color-fg-subtle)] text-center mb-3 break-all line-clamp-3">
          {invoice}
        </p>
        <Button fullWidth variant="secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar invoice"}
        </Button>
        <Button fullWidth variant="ghost" size="sm" onClick={() => setInvoice(null)} className="mt-2">
          Gerar outra
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--color-fg-muted)] text-center">
        Gere uma invoice BOLT11 real pela carteira Spark. Qualquer carteira Lightning consegue pagar.
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">
          Valor (sats)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">
          Descrição (opcional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Receber Bitcoin"
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <Button fullWidth size="lg" loading={loading} onClick={handleGenerate}>
        <Zap size={18} /> Gerar invoice
      </Button>
    </div>
  );
}

// ── Method 2: WebLN ──────────────────────────────────────────────

function WebLNReceiveForm() {
  const { push } = useToast();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrUrl = useQRCode(invoice ? `lightning:${invoice}` : null);
  const available = isWebLNAvailable();

  const handleGenerate = async () => {
    setError(null);
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { setError("Digite um valor em sats."); return; }
    setLoading(true);
    try {
      const pr = await makeWebLNInvoice(amt, memo || undefined);
      setInvoice(pr);
      push("success", "Invoice gerada via WebLN!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na extensão WebLN.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { push("error", "Não foi possível copiar."); }
  };

  if (!available) {
    return (
      <div className="flex flex-col gap-3 items-center text-center py-4">
        <Globe size={32} className="text-[var(--color-fg-subtle)]" />
        <p className="text-sm text-[var(--color-fg-muted)]">
          WebLN não detectada. Instale uma extensão como Alby ou Joule no navegador para usar este método.
        </p>
        <a
          href="https://getalby.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--color-primary)] font-medium inline-flex items-center gap-1"
        >
          Instalar Alby <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  if (invoice) {
    return (
      <div>
        <QRDisplay url={qrUrl} />
        <p className="text-xs text-[var(--color-fg-subtle)] text-center mb-3 break-all line-clamp-3">
          {invoice}
        </p>
        <Button fullWidth variant="secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar invoice"}
        </Button>
        <Button fullWidth variant="ghost" size="sm" onClick={() => setInvoice(null)} className="mt-2">
          Gerar outra
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--color-fg-muted)] text-center">
        Gere a invoice direto pela extensão WebLN (Alby, Joule, etc.).
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">Valor (sats)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">Descrição (opcional)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Pagamento..."
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <Button fullWidth size="lg" loading={loading} onClick={handleGenerate}>
        <Globe size={18} /> Gerar via WebLN
      </Button>
    </div>
  );
}

// ── Method 3: Paste Invoice ──────────────────────────────────────

function PasteInvoiceForm() {
  const { push } = useToast();
  const [invoice, setInvoice] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = invoice.trim();
  const valid = /^lnbc\d/i.test(trimmed.toLowerCase());
  const qrUrl = useQRCode(valid ? `lightning:${trimmed}` : null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInvoice(text);
      setError(null);
    } catch {
      setError("Não foi possível acessar a área de transferência. Cole manualmente.");
    }
  };

  const handleCopy = async () => {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { push("error", "Não foi possível copiar."); }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--color-fg-muted)] text-center">
        Gere uma invoice na sua carteira, cole aqui e o app cria o QR code para alguém escanear e pagar.
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">
          Invoice BOLT11
        </label>
        <textarea
          value={invoice}
          onChange={(e) => { setInvoice(e.target.value); setError(null); }}
          placeholder="lnbc..."
          rows={3}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] resize-none break-all"
        />
        <button
          onClick={handlePaste}
          className="text-xs text-[var(--color-primary)] font-medium self-start inline-flex items-center gap-1"
        >
          <ClipboardPaste size={14} /> Colar da área de transferência
        </button>
      </div>

      {invoice && !valid && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> Invoice BOLT11 inválida.
        </p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {valid && (
        <>
          <QRDisplay url={qrUrl} />
          <Button fullWidth variant="secondary" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar invoice"}
          </Button>
        </>
      )}
    </div>
  );
}

// ── QR display ───────────────────────────────────────────────────

function QRDisplay({ url }: { url: string | null }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="w-48 h-48 bg-white rounded-[var(--radius-lg)] flex items-center justify-center p-3">
        {url ? (
          <img src={url} alt="QR Code" width={160} height={160} className="rounded" />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface-2)] rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ── Send modal ────────────────────────────────────────────────────

function SendModal({
  onClose,
  maxAmount,
  onSent,
}: {
  onClose: () => void;
  maxAmount: number;
  onSent: () => void;
}) {
  const { push } = useToast();
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<InputType | null>(null);
  const [parsing, setParsing] = useState(false);
  const [feeSats, setFeeSats] = useState<number | null>(null);
  const [needsAmount, setNeedsAmount] = useState(false);

  const trimmed = input.trim();
  const normalized = trimmed.replace(/^lightning:\s*/i, "").replace(/^bitcoin:\s*/i, "").trim();

  // Parse input via SDK
  useEffect(() => {
    if (!normalized) {
      setParsed(null);
      setFeeSats(null);
      setNeedsAmount(false);
      return;
    }
    setParsing(true);
    setError(null);
    const timeout = setTimeout(async () => {
      try {
        const result = await parseInput(normalized);
        setParsed(result);
        if (result.type === "lnurlPay" || result.type === "lightningAddress") {
          setNeedsAmount(true);
        } else if (result.type === "bolt11Invoice") {
          setNeedsAmount(!result.amountMsat);
        } else {
          setNeedsAmount(false);
        }
      } catch {
        setParsed(null);
      } finally {
        setParsing(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [normalized]);

  const handleSend = async () => {
    setError(null);
    if (!normalized) { setError("Digite uma invoice, LNURL ou endereço Lightning."); return; }

    setSending(true);
    try {
      // Try WebLN first if available
      if (isWebLNAvailable()) {
        try {
          await sendWebLNPayment(normalized);
          onSent();
          onClose();
          return;
        } catch {
          push("info", "WebLN falhou, tentando via Spark SDK...");
        }
      }

      // Use Spark SDK
      const amt = parseInt(amount, 10);
      const prepareRes = await prepareSendPayment(normalized, needsAmount && amt ? amt : undefined);
      setFeeSats(Number(prepareRes.feePolicy));

      const payment = await sendPayment(prepareRes);
      if (payment.status === "completed" || payment.status === "pending") {
        onSent();
        onClose();
      } else {
        setError("Pagamento falhou.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar pagamento.";
      if (/invalid input/i.test(msg)) {
        setError("Texto não reconhecido. Cole uma invoice BOLT11 (lnbc...), LNURL ou endereço Lightning válido.");
      } else {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const inputLabel = (() => {
    if (!parsed) return null;
    switch (parsed.type) {
      case "bolt11Invoice":
        return `Invoice BOLT11${parsed.amountMsat ? ` · ${SAT}${formatAmount(parsed.amountMsat / 1000)}` : ""}`;
      case "lightningAddress":
        return `Endereço Lightning · ${parsed.address}`;
      case "lnurlPay":
        return `LNURL-Pay · Min: ${SAT}${formatAmount(parsed.minSendable / 1000)} · Max: ${SAT}${formatAmount(parsed.maxSendable / 1000)}`;
      case "sparkAddress":
        return `Endereço Spark`;
      case "sparkInvoice":
        return `Invoice Spark`;
      case "bitcoinAddress":
        return `Endereço Bitcoin (on-chain)`;
      default:
        return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-5" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-bold text-[var(--color-fg)] mb-4">Enviar Bitcoin</h3>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-fg-muted)]">
              Invoice, LNURL ou endereço Lightning
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="lnbc... / LNURL1... / usuario@dominio.com"
              rows={2}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] resize-none break-all"
            />
            {trimmed && !parsing && !parsed && (
              <p className="text-xs text-[var(--color-fg-subtle)]">
                Formato não reconhecido. Verifique se colou uma invoice BOLT11, LNURL ou endereço Lightning completo.
              </p>
            )}
            {parsing && (
              <p className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                Analisando...
              </p>
            )}
            {inputLabel && !parsing && (
              <p className="text-xs text-[var(--color-success)]">
                {inputLabel}
              </p>
            )}
          </div>

          {needsAmount && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-fg-muted)]">
                Quantidade (sats)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <span className="text-xs text-[var(--color-fg-subtle)]">
                Disponível: {SAT}{formatAmount(maxAmount)}
              </span>
            </div>
          )}

          {feeSats !== null && (
            <div className="flex justify-between items-center px-4 py-3 bg-[var(--color-surface)] rounded-[var(--radius-md)]">
              <span className="text-sm text-[var(--color-fg-muted)]">Taxa</span>
              <span className="text-sm font-bold text-[var(--color-fg)]">{SAT}{formatAmount(feeSats)}</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <Button fullWidth size="lg" loading={sending} disabled={parsing || !normalized} onClick={handleSend}>
            <ArrowUpFromLine size={18} /> {isWebLNAvailable() ? "Pagar" : "Enviar via Spark"}
          </Button>

          <Button fullWidth variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Seed backup modal ─────────────────────────────────────────────

function SeedModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = exportMnemonic();
    setSeed(s);
  }, []);

  const handleCopy = async () => {
    if (!seed) return;
    try {
      await navigator.clipboard.writeText(seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-5" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 max-w-sm w-full"
      >
        <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2 text-center">Backup da Carteira</h3>
        <p className="text-xs text-[var(--color-fg-muted)] text-center mb-4">
          Estas 12 palavras são a chave do seu Bitcoin. Guarde com segurança e nunca compartilhe com ninguém.
        </p>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 mb-4">
          {seed ? (
            visible ? (
              <p className="text-sm text-[var(--color-fg)] font-mono leading-relaxed break-all">
                {seed}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-fg-subtle)] text-center py-2">
                • • • • • • • • • • • •
              </p>
            )
          ) : (
            <p className="text-sm text-[var(--color-fg-subtle)] text-center">Carregando...</p>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            fullWidth
            variant="secondary"
            size="sm"
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            {visible ? "Esconder" : "Revelar"}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>

        <Button fullWidth variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </motion.div>
    </div>
  );
}

// ── API Key Setup ─────────────────────────────────────────────────

function ApiKeySetup({ error, onSaved }: { error: string | null; onSaved: () => void }) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    setLocalError(null);
    if (!key.trim()) {
      setLocalError("Cole sua Breez API key aqui.");
      return;
    }
    setSaving(true);
    storeApiKey(key.trim());
    setSaving(false);
    onSaved();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setKey(text);
    } catch {
      setLocalError("Não foi possível acessar a área de transferência.");
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto pt-4">
      <div className="flex flex-col items-center text-center gap-2 mb-2">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center">
          <KeyRound size={28} className="text-[var(--color-primary)]" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-fg)]">Conectar carteira real</h2>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Para usar Bitcoin real na rede Lightning, você precisa de uma Breez API key gratuita. Se já estiver configurada no ambiente, a carteira conecta automaticamente.
        </p>
      </div>

      <a
        href="https://breez.technology/request-api-key/#contact-us-form-sdk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
      >
        Solicitar chave gratuita <ExternalLink size={14} />
      </a>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-fg-muted)]">
          Breez API Key
        </label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Cole sua API key aqui"
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button
          onClick={handlePaste}
          className="text-xs text-[var(--color-primary)] font-medium self-start inline-flex items-center gap-1"
        >
          <ClipboardPaste size={14} /> Colar
        </button>
      </div>

      {(localError || error) && (
        <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle size={14} /> {localError || error}
        </p>
      )}

      <Button fullWidth size="lg" loading={saving} onClick={handleSave}>
        <Zap size={18} /> Conectar carteira
      </Button>

      <p className="text-xs text-[var(--color-fg-subtle)] text-center">
        A chave é guardada apenas no seu navegador. É grátis e leva 2 minutos para receber por email.
      </p>
    </div>
  );
}

// ── Transaction row ──────────────────────────────────────────────

function SparkTxRow({ tx }: { tx: Payment }) {
  const isReceive = tx.paymentType === "receive";
  const isCompleted = tx.status === "completed";
  const isPending = tx.status === "pending";
  const amount = Number(tx.amount);
  const fees = Number(tx.fees);

  let label = isReceive ? "Recebido" : "Enviado";
  if (tx.method === "spark") label = isReceive ? "Spark recebido" : "Spark enviado";
  if (tx.method === "lightning") label = isReceive ? "Lightning recebido" : "Lightning enviado";
  if (tx.method === "deposit") label = "Depósito";
  if (tx.method === "withdraw") label = "Saque";

  return (
    <li>
      <Card className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isReceive ? "bg-[var(--color-success-soft)]" : "bg-[var(--color-surface-2)]"
        }`}>
          <span className="text-sm font-bold" aria-hidden>{isReceive ? SAT : "→"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-fg)] truncate">{label}</p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            {isPending ? "Pendente" : isCompleted ? formatTxDate(tx.timestamp) : "Falhou"}
            {fees > 0 ? ` · Taxa: ${SAT}${formatAmount(fees)}` : ""}
          </p>
        </div>
        <span className={`text-sm font-bold tabular-nums ${
          isReceive ? "text-[var(--color-success)]" : "text-[var(--color-fg-muted)]"
        }`}>
          {isReceive ? "+" : ""}{SAT}{formatAmount(amount)}
        </span>
      </Card>
    </li>
  );
}

function formatTxDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

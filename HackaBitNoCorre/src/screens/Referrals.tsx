import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Users, Gift, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Mascot } from "@/components/Mascot";
import { SAT, formatAmount } from "@/lib/format";
import { generateReferralCode, getReferralStats } from "@/lib/rewards";
import type { Invite } from "@/lib/types";

export function Referrals() {
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rewardSats: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [codeResult, statsResult, { data: inviteData }] = await Promise.all([
        generateReferralCode(),
        getReferralStats(),
        supabase.from("invites").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (codeResult.code) setCode(codeResult.code);
      setStats(statsResult);
      setInvites((inviteData as Invite[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      push("success", "Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      push("error", "Não foi possível copiar.");
    }
  };

  const buildLink = () => {
    const base = window.location.origin;
    return `${base}/cadastro?ref=${code}`;
  };

  const handleWhatsApp = async () => {
    const link = buildLink();
    const msg = `Aprenda Bitcoin e ganhe recompensas de verdade! Usa meu código ${code} e começa a ganhar: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleTelegram = async () => {
    const link = buildLink();
    const msg = `Aprenda Bitcoin e ganhe recompensas de verdade! Usa meu código ${code} e começa a ganhar: ${link}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    const result = await generateReferralCode();
    setGenerating(false);
    if (result.error) {
      push("error", "Limite diário de códigos atingido.");
      return;
    }
    if (result.code) {
      setCode(result.code);
      push("success", "Novo código gerado!");
    }
  };

  if (loading) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-8">
      <button
        onClick={() => navigate("/app/perfil")}
        className="text-sm text-[var(--color-fg-muted)] mb-4 hover:text-[var(--color-fg)] transition-colors"
      >
        ← Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Mascot size={48} expression="happy" />
        <div>
          <h1 className="text-xl font-bold text-[var(--color-fg)]">Indicar amigos</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Convide e ganhe Bitcoin por cada amigo
          </p>
        </div>
      </div>

      {/* Referral code card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-5 mb-4">
          <p className="text-sm text-[var(--color-fg-muted)] mb-2">Seu código</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-[var(--color-surface-2)] rounded-[var(--radius-md)] px-4 py-3">
              <span className="text-xl font-bold tracking-wider text-[var(--color-primary)]">
                {code || "------"}
              </span>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={handleWhatsApp}>
              <Share2 size={16} /> WhatsApp
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTelegram}>
              <Share2 size={16} /> Telegram
            </Button>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="w-full text-xs text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] mt-3 transition-colors"
          >
            {generating ? "Gerando..." : "Gerar novo código"}
          </button>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="p-3 flex flex-col items-center text-center">
          <Users size={18} className="text-[var(--color-info)] mb-1" />
          <span className="text-lg font-bold text-[var(--color-fg)]">{stats.total}</span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">total</span>
        </Card>
        <Card className="p-3 flex flex-col items-center text-center">
          <Clock size={18} className="text-[var(--color-warning)] mb-1" />
          <span className="text-lg font-bold text-[var(--color-fg)]">{stats.pending}</span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">pendentes</span>
        </Card>
        <Card className="p-3 flex flex-col items-center text-center">
          <Gift size={18} className="text-[var(--color-primary)] mb-1" />
          <span className="text-lg font-bold text-[var(--color-fg)]">
            {SAT}{formatAmount(stats.rewardSats)}
          </span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">ganhos</span>
        </Card>
      </div>

      {/* History */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Histórico de convites
      </h2>
      {invites.length === 0 ? (
        <Card className="p-6 flex flex-col items-center gap-3">
          <Mascot size={40} expression="curious" />
          <p className="text-sm text-[var(--color-fg-muted)] text-center">
            Você ainda não convidou ninguém. Compartilhe seu código!
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id}>
              <Card className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  invite.used_by
                    ? "bg-[var(--color-success-soft)]"
                    : "bg-[var(--color-surface-2)]"
                }`}>
                  {invite.used_by ? (
                    <CheckCircle2 size={20} className="text-[var(--color-success)]" />
                  ) : (
                    <Clock size={18} className="text-[var(--color-fg-subtle)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-fg)]">
                    Código: {invite.code}
                  </p>
                  <p className="text-xs text-[var(--color-fg-subtle)]">
                    {invite.used_by ? "Completo" : "Pendente"} ·{" "}
                    {new Date(invite.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {invite.used_by && (
                  <span className="text-sm font-bold text-[var(--color-success)]">
                    +{SAT}{formatAmount(invite.reward_sats)}
                  </span>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

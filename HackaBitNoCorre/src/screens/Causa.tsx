import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  BookOpen,
  HandHeart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { becomeSupporter, recordDonation, getTransparencyStats } from "@/lib/rewards";
import { formatAmount } from "@/lib/format";
import type { Partner, ImpactStory, CommunityWallPost, Supporter } from "@/lib/types";

const SUPPORTER_TITLES = [
  { title: "Anjo", min: 0, emoji: "😇" },
  { title: "Guardião", min: 1000, emoji: "🛡️" },
  { title: "Transformador", min: 5000, emoji: "✨" },
  { title: "Mentor", min: 10000, emoji: "🎓" },
  { title: "Lenda", min: 50000, emoji: "👑" },
];

const FAQ_ITEMS = [
  {
    q: "Para onde vai minha doação?",
    a: "100% das doações são usadas para financiar a educação de jovens em vulnerabilidade social. A transparência é total: cada satoshi é rastreável na rede Bitcoin.",
  },
  {
    q: "Por que Bitcoin e Lightning?",
    a: "Bitcoin permite microdoações com taxas quase zero, sem intermediários e com total transparência. A Lightning Network torna os pagamentos instantâneos.",
  },
  {
    q: "Quem são os beneficiários?",
    a: "Crianças em abrigos, adolescentes em acolhimento institucional, jovens em situação de vulnerabilidade e estudantes de escolas públicas.",
  },
  {
    q: "Como funciona o ciclo de transformação?",
    a: "O jovem apoiado hoje aprende, desenvolve habilidades e conquista autonomia. No futuro, ele retorna à plataforma como apoiador de outra criança, criando uma corrente infinita de impacto.",
  },
  {
    q: "Posso doar qualquer valor?",
    a: "Sim! Não existe valor mínimo. Mesmo 100 satoshis (menos de 1 centavo) fazem diferença quando somados a outros apoiadores.",
  },
];

export function Causa() {
  const { profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const [stats, setStats] = useState({ totalSatsRaised: 0, totalSupporters: 0, totalYouthImpacted: 0, totalHoursSponsored: 0, totalProjectsFunded: 0 });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [wall, setWall] = useState<CommunityWallPost[]>([]);
  const [topSupporters, setTopSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(100);
  const [donateMessage, setDonateMessage] = useState("");
  const [donateAnonymous, setDonateAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [wallMessage, setWallMessage] = useState("");
  const [postingWall, setPostingWall] = useState(false);

  useEffect(() => {
    (async () => {
      const [statsData, partnersData, storiesData, wallData, supportersData] = await Promise.all([
        getTransparencyStats(),
        supabase.from("partners").select("*").order("created_at"),
        supabase.from("impact_stories").select("*").eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("community_wall").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("supporters").select("*").eq("is_public", true).order("total_sats", { ascending: false }).limit(10),
      ]);
      setStats(statsData);
      setPartners((partnersData.data as Partner[]) ?? []);
      setStories((storiesData.data as ImpactStory[]) ?? []);
      setWall((wallData.data as CommunityWallPost[]) ?? []);
      setTopSupporters((supportersData.data as Supporter[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleBecomeSupporter = async () => {
    const result = await becomeSupporter(profile?.name);
    if (result.error) {
      push("error", "Não foi possível tornar-se apoiador agora.");
      return;
    }
    await refreshProfile();
    push("success", "Bem-vindo! Agora você é um apoiador da causa.");
  };

  const handleDonate = async () => {
    if (donateAmount <= 0) {
      push("error", "Digite um valor válido.");
      return;
    }
    setDonating(true);
    const result = await recordDonation(donateAmount, donateMessage.trim() || undefined, donateAnonymous);
    setDonating(false);
    if (result.error) {
      push("error", "Não foi possível registrar a doação.");
      return;
    }
    push("success", `Doação de ${formatAmount(donateAmount)} sats registrada! Obrigado!`);
    setDonateAmount(100);
    setDonateMessage("");
    setShowDonate(false);
    const newStats = await getTransparencyStats();
    setStats(newStats);
  };

  const handlePostWall = async () => {
    if (!wallMessage.trim()) return;
    setPostingWall(true);
    const { data, error } = await supabase.from("community_wall").insert({
      type: "message",
      content: wallMessage.trim(),
    }).select("*").single();
    setPostingWall(false);
    if (error) {
      push("error", "Não foi possível publicar.");
      return;
    }
    if (data) {
      setWall((prev) => [data as CommunityWallPost, ...prev]);
    }
    setWallMessage("");
    push("success", "Mensagem publicada no mural!");
  };

  if (loading) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-64 mb-6" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-[var(--color-primary)]" fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
          ABRAÇE A CAUSA
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)] max-w-xs mx-auto leading-relaxed">
          Toda grande transformação começa quando alguém acredita no potencial de uma criança.
        </p>
        <p className="text-xs text-[var(--color-fg-subtle)] mt-3 italic">
          "Aprender hoje. Transformar amanhã. Retribuir para sempre."
        </p>
        <div className="mt-6">
          <Button size="lg" onClick={() => (profile?.is_supporter ? setShowDonate(true) : handleBecomeSupporter())}>
            <Heart size={18} /> {profile?.is_supporter ? "Quero Apoiar" : "Quero Apoiar"}
          </Button>
        </div>
      </motion.div>

      {/* Transparency Panel */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Transparência em tempo real
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-8">
        <Card className="p-4 flex flex-col items-center text-center">
          <TrendingUp size={20} className="text-[var(--color-primary)] mb-1" />
          <span className="text-xl font-bold text-[var(--color-fg)] tabular-nums">
            {formatAmount(stats.totalSatsRaised)}
          </span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">sats arrecadados</span>
        </Card>
        <Card className="p-4 flex flex-col items-center text-center">
          <Users size={20} className="text-[var(--color-info)] mb-1" />
          <span className="text-xl font-bold text-[var(--color-fg)] tabular-nums">
            {stats.totalSupporters}
          </span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">apoiadores</span>
        </Card>
        <Card className="p-4 flex flex-col items-center text-center">
          <Heart size={20} className="text-[var(--color-error)] mb-1" />
          <span className="text-xl font-bold text-[var(--color-fg)] tabular-nums">
            {stats.totalYouthImpacted}
          </span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">jovens impactados</span>
        </Card>
        <Card className="p-4 flex flex-col items-center text-center">
          <Clock size={20} className="text-[var(--color-secondary)] mb-1" />
          <span className="text-xl font-bold text-[var(--color-fg)] tabular-nums">
            {stats.totalHoursSponsored}
          </span>
          <span className="text-[10px] text-[var(--color-fg-subtle)]">horas patrocinadas</span>
        </Card>
      </div>

      {/* How it works */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Como funciona
      </h2>
      <Card className="p-5 mb-8">
        <div className="flex flex-col gap-4">
          {[
            { icon: <HandHeart size={20} className="text-[var(--color-primary)]" />, text: "Pessoa apoia com microdoação" },
            { icon: <BookOpen size={20} className="text-[var(--color-info)]" />, text: "Jovem recebe acesso à educação" },
            { icon: <Sparkles size={20} className="text-[var(--color-secondary)]" />, text: "Aprende e desenvolve habilidades" },
            { icon: <TrendingUp size={20} className="text-[var(--color-warning)]" />, text: "Conquista autonomia financeira" },
            { icon: <Heart size={20} className="text-[var(--color-error)]" />, text: "Retorna como apoiador de outra criança" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                {step.icon}
              </div>
              <span className="text-sm text-[var(--color-fg)] flex-1">{step.text}</span>
              {i < 4 && <ArrowRight size={16} className="text-[var(--color-fg-subtle)] rotate-90" />}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-fg-subtle)]">
            Uma corrente infinita de transformação social
          </p>
        </div>
      </Card>

      {/* Who you help */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Quem você ajuda
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {[
          { emoji: "🏠", label: "Crianças em abrigos" },
          { emoji: "🤗", label: "Adolescentes em acolhimento" },
          { emoji: "📚", label: "Jovens em vulnerabilidade" },
          { emoji: "🏫", label: "Estudantes de escolas públicas" },
        ].map((item) => (
          <Card key={item.label} className="p-4 flex flex-col items-center text-center gap-2">
            <span className="text-3xl" aria-hidden>{item.emoji}</span>
            <span className="text-xs text-[var(--color-fg-muted)] leading-tight">{item.label}</span>
          </Card>
        ))}
      </div>

      {/* Impact stories */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Histórias de transformação
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {stories.map((story) => (
          <Card key={story.id} className="p-5">
            <h3 className="text-base font-semibold text-[var(--color-fg)] mb-2">
              {story.title}
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed mb-3">
              {story.content}
            </p>
            <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
              {story.is_anonymized ? (
                <span>Por {story.author_name ?? "Anônimo"}, {story.author_age ?? "?"} anos — {story.author_city ?? "Brasil"}</span>
              ) : (
                <span>Por {story.author_name ?? "Anônimo"}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Top supporters */}
      {topSupporters.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
            Apoiadores em destaque
          </h2>
          <div className="flex flex-col gap-2 mb-8">
            {topSupporters.map((s, i) => {
              const titleInfo = [...SUPPORTER_TITLES].reverse().find((t) => s.total_sats >= t.min) ?? SUPPORTER_TITLES[0];
              return (
                <Card key={s.id} className="p-3 flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? "bg-[var(--color-warning)] text-black" :
                    i === 1 ? "bg-[var(--color-surface-3)] text-[var(--color-fg)]" :
                    i === 2 ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" :
                    "bg-[var(--color-surface-2)] text-[var(--color-fg-subtle)]"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-xl" aria-hidden>{s.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                      {s.display_name}
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      {titleInfo.emoji} {titleInfo.title} · Nível {s.level}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)] tabular-nums">
                    {formatAmount(s.total_sats)} sats
                  </span>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Partners */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Parceiros verificados
      </h2>
      <div className="flex flex-col gap-2 mb-8">
        {partners.map((p) => (
          <Card key={p.id} className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center text-2xl shrink-0">
              {p.type === "abrigo" ? "🏠" : p.type === "escola" ? "🏫" : p.type === "ong" ? "🤝" : p.type === "universidade" ? "🎓" : p.type === "empresa" ? "🏢" : "📋"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[var(--color-fg)] truncate">{p.name}</p>
                {p.is_verified && (
                  <CheckCircle2 size={14} className="text-[var(--color-secondary)] shrink-0" />
                )}
              </div>
              <p className="text-xs text-[var(--color-fg-subtle)] line-clamp-2">{p.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Community wall */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Mural da comunidade
      </h2>
      <Card className="p-4 mb-3">
        <textarea
          value={wallMessage}
          onChange={(e) => setWallMessage(e.target.value)}
          placeholder="Deixe uma mensagem de apoio..."
          maxLength={200}
          rows={2}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none mb-3"
        />
        <Button size="sm" fullWidth onClick={handlePostWall} loading={postingWall} disabled={!wallMessage.trim()}>
          <MessageCircle size={16} /> Publicar no mural
        </Button>
      </Card>
      <div className="flex flex-col gap-2 mb-8">
        {wall.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-[var(--color-fg-muted)]">
              Seja o primeiro a deixar uma mensagem!
            </p>
          </Card>
        ) : (
          wall.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start gap-2">
                <MessageCircle size={16} className="text-[var(--color-fg-subtle)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-fg)] leading-relaxed">{post.content}</p>
              </div>
              <p className="text-xs text-[var(--color-fg-subtle)] mt-2">
                {new Date(post.created_at).toLocaleDateString("pt-BR")}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* FAQ */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Perguntas frequentes
      </h2>
      <div className="flex flex-col gap-2 mb-8">
        {FAQ_ITEMS.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-medium text-[var(--color-fg)]">{item.q}</span>
              {openFaq === i ? (
                <ChevronUp size={18} className="text-[var(--color-fg-subtle)] shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-[var(--color-fg-subtle)] shrink-0" />
              )}
            </button>
            {openFaq === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="px-4 pb-4"
              >
                <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{item.a}</p>
              </motion.div>
            )}
          </Card>
        ))}
      </div>

      {/* Donate modal */}
      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowDonate(false)}>
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-t-[var(--radius-xl)] p-6 pb-[calc(env(safe-area-inset-bottom)+24px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-[var(--color-surface-3)] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-fg)] mb-1">Fazer uma doação</h3>
            <p className="text-sm text-[var(--color-fg-muted)] mb-4">
              Cada satoshi ajuda a transformar uma vida.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDonateAmount(amt)}
                  className={`py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors ${
                    donateAmount === amt
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-fg)]"
                  }`}
                >
                  {formatAmount(amt)}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={donateAmount}
              onChange={(e) => setDonateAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full h-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 text-base text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-3"
              placeholder="Quantia em sats"
            />

            <textarea
              value={donateMessage}
              onChange={(e) => setDonateMessage(e.target.value)}
              placeholder="Mensagem (opcional)"
              maxLength={100}
              rows={2}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none mb-3"
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={donateAnonymous}
                onChange={(e) => setDonateAnonymous(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-fg-muted)]">Doar anonimamente</span>
            </label>

            <Button fullWidth size="lg" onClick={handleDonate} loading={donating}>
              <Heart size={18} /> Doar {formatAmount(donateAmount)} sats
            </Button>
          </motion.div>
        </div>
      )}

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-4"
      >
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at center, var(--color-primary), transparent 70%)" }} />
          <div className="relative">
            <Shield size={32} className="text-[var(--color-secondary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-fg)] font-medium mb-1">
              Junte-se a nós nesta corrente de transformação.
            </p>
            <p className="text-xs text-[var(--color-fg-muted)] mb-4">
              Toda criança merece uma oportunidade. Toda oportunidade pode mudar uma vida.
            </p>
            <Button size="lg" onClick={() => (profile?.is_supporter ? setShowDonate(true) : handleBecomeSupporter())}>
              <Heart size={18} /> {profile?.is_supporter ? "Doar agora" : "Quero Apoiar"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

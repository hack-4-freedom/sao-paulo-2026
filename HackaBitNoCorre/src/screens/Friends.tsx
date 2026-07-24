import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Search,
  Check,
  X,
  Users,
  Trophy,
  Flame,
  Zap,
  Trash2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Mascot } from "@/components/Mascot";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from "@/lib/rewards";
import type { Friend, FriendRequest, Profile as ProfileType } from "@/lib/types";

export function Friends() {
  const { profile, user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<(Friend & { profile: ProfileType })[]>([]);
  const [requests, setRequests] = useState<(FriendRequest & { sender: ProfileType })[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "ranking">("friends");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [friendsRes, requestsRes] = await Promise.all([
      supabase.from("friends").select("*").eq("user_id", user.id),
      supabase
        .from("friend_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending"),
    ]);

    const friendList = (friendsRes.data as Friend[]) ?? [];
    const requestList = (requestsRes.data as FriendRequest[]) ?? [];

    const friendsWithProfiles = await Promise.all(
      friendList.map(async (f) => {
        const { data: friendProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", f.friend_id)
          .maybeSingle();
        return { ...f, profile: friendProfile as ProfileType };
      })
    );

    const requestsWithProfiles = await Promise.all(
      requestList.map(async (r) => {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", r.sender_id)
          .maybeSingle();
        return { ...r, sender: senderProfile as ProfileType };
      })
    );

    setFriends(friendsWithProfiles);
    setRequests(requestsWithProfiles);
    setLoading(false);
  };

  const handleSendRequest = async () => {
    if (!searchCode.trim()) return;
    setSending(true);
    const result = await sendFriendRequest(searchCode.trim().toUpperCase());
    setSending(false);
    if (result.error) {
      const messages: Record<string, string> = {
        friend_code_not_found: "Código de amizade não encontrado.",
        cannot_add_self: "Você não pode adicionar a si mesmo.",
        already_friends: "Vocês já são amigos.",
        request_already_pending: "Já existe uma solicitação pendente.",
      };
      push("error", messages[result.error] ?? "Não foi possível enviar a solicitação.");
      return;
    }
    push("success", "Solicitação de amizade enviada!");
    setSearchCode("");
  };

  const handleAccept = async (requestId: string) => {
    const result = await acceptFriendRequest(requestId);
    if (result.error) {
      push("error", "Não foi possível aceitar a solicitação.");
      return;
    }
    push("success", "Nova amizade adicionada!");
    loadData();
  };

  const handleReject = async (requestId: string) => {
    const result = await rejectFriendRequest(requestId);
    if (result.error) {
      push("error", "Não foi possível rejeitar a solicitação.");
      return;
    }
    loadData();
  };

  const handleRemoveFriend = async (friendId: string) => {
    const { error } = await supabase
      .from("friends")
      .delete()
      .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`)
      .eq("friend_id", friendId);
    if (error) {
      push("error", "Não foi possível remover o amigo.");
      return;
    }
    push("success", "Amigo removido.");
    loadData();
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

  const sortedFriends = [...friends].sort((a, b) => b.profile.xp_total - a.profile.xp_total);

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
          <h1 className="text-xl font-bold text-[var(--color-fg)]">Amigos</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Adicione amigos e compare o progresso
          </p>
        </div>
      </div>

      {/* Add friend */}
      <Card className="p-4 mb-4">
        <label className="text-sm font-medium text-[var(--color-fg-muted)] mb-2 block">
          Adicionar por código de amizade
        </label>
        <div className="flex items-center gap-2">
          <Input
            name="searchCode"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="SAT-XXXXXX"
            leftSlot={<Search size={18} />}
            className="flex-1"
          />
          <Button size="md" onClick={handleSendRequest} loading={sending} disabled={!searchCode.trim()}>
            <UserPlus size={18} />
          </Button>
        </div>
        {profile?.friend_code && (
          <p className="text-xs text-[var(--color-fg-subtle)] mt-3">
            Seu código: <span className="font-mono font-semibold text-[var(--color-fg)]">{profile.friend_code}</span>
          </p>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {[
          { key: "friends" as const, label: "Amigos", icon: <Users size={16} /> },
          { key: "requests" as const, label: `Solicitações${requests.length > 0 ? ` (${requests.length})` : ""}`, icon: <Clock size={16} /> },
          { key: "ranking" as const, label: "Ranking", icon: <Trophy size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                : "bg-[var(--color-surface)] text-[var(--color-fg-muted)]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {activeTab === "friends" && (
        <div className="flex flex-col gap-2">
          {friends.length === 0 ? (
            <EmptyState
              emoji="🤝"
              title="Nenhum amigo ainda"
              description="Adicione amigos usando o código de amizade deles."
              action={<Mascot size={48} expression="curious" />}
            />
          ) : (
            friends.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-3 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{f.profile.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                      {f.profile.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-fg-subtle)]">
                      <span className="flex items-center gap-0.5">
                        <Zap size={12} /> {f.profile.xp_total} XP
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Flame size={12} /> {f.profile.streak_days}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(f.friend_id)}
                    className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-fg-subtle)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === "requests" && (
        <div className="flex flex-col gap-2">
          {requests.length === 0 ? (
            <EmptyState
              emoji="📭"
              title="Sem solicitações"
              description="Quando alguém te adicionar, aparece aqui."
              action={<Mascot size={48} expression="curious" />}
            />
          ) : (
            requests.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-3 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{r.sender.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                      {r.sender.name}
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Quer ser seu amigo
                    </p>
                  </div>
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="w-8 h-8 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-fg-subtle)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Ranking tab */}
      {activeTab === "ranking" && (
        <div className="flex flex-col gap-2">
          {sortedFriends.length === 0 ? (
            <EmptyState
              emoji="🏆"
              title="Sem ranking ainda"
              description="Adicione amigos para ver o ranking de XP."
              action={<Mascot size={48} expression="thinking" />}
            />
          ) : (
            <>
              {profile && (
                <Card className="p-3 flex items-center gap-3 border-[var(--color-primary)]/40 mb-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    ★
                  </span>
                  <span className="text-2xl" aria-hidden>{profile.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                      {profile.name} (você)
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Nível {profile.level} · {profile.streak_days} dias de sequência
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    {profile.xp_total} XP
                  </span>
                </Card>
              )}
              {sortedFriends.map((f, i) => (
                <Card key={f.id} className="p-3 flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? "bg-[var(--color-warning)] text-black" :
                    i === 1 ? "bg-[var(--color-surface-3)] text-[var(--color-fg)]" :
                    i === 2 ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" :
                    "bg-[var(--color-surface-2)] text-[var(--color-fg-subtle)]"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-2xl" aria-hidden>{f.profile.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                      {f.profile.name}
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Nível {f.profile.level} · {f.profile.streak_days} dias
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    {f.profile.xp_total} XP
                  </span>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

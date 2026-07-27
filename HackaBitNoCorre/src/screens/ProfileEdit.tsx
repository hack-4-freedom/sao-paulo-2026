import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Trash2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Mascot } from "@/components/Mascot";
import { updateProfile, deleteAccount } from "@/lib/rewards";

const AVATARS = ["🙂", "🦊", "⚡", "🦁", "🐯", "🐻", "🦉", "🐱", "🚀", "🔥", "💎", "🌟"];

export function ProfileEdit() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar_emoji ?? "🙂");
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      avatarEmoji: avatar,
      birthdate: birthdate || undefined,
      bio: bio.trim(),
    });
    setSaving(false);
    if (result.error) {
      push("error", "Não foi possível salvar.");
      return;
    }
    await refreshProfile();
    push("success", "Perfil atualizado!");
    navigate("/app/perfil");
  };

  const handleExport = async () => {
    if (!profile) return;
    const { data: wallet } = await supabase.from("wallets").select("*").maybeSingle();
    const { data: progress } = await supabase.from("lesson_progress").select("*");
    const { data: badges } = await supabase.from("user_badges").select("*");
    const { data: scores } = await supabase.from("game_scores").select("*");
    const exportData = {
      profile,
      wallet,
      lessonProgress: progress,
      badges,
      gameScores: scores,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bitcoin-no-corre-dados.json";
    a.click();
    URL.revokeObjectURL(url);
    push("success", "Dados exportados!");
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const result = await deleteAccount();
    if (result.error) {
      push("error", "Não foi possível excluir a conta.");
      return;
    }
    await signOut();
    navigate("/");
  };

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-8">
      <button
        onClick={() => navigate("/app/perfil")}
        className="text-sm text-[var(--color-fg-muted)] mb-4 hover:text-[var(--color-fg)] transition-colors"
      >
        ← Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Mascot size={48} expression="curious" />
        <div>
          <h1 className="text-xl font-bold text-[var(--color-fg)]">Editar perfil</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Atualize suas informações
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Avatar picker */}
        <Card className="p-4">
          <label className="text-sm font-medium text-[var(--color-fg-muted)] mb-3 block">
            Avatar
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-2xl transition-all ${
                  avatar === emoji
                    ? "bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </Card>

        {/* Name */}
        <Input
          label="Nome"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          required
        />

        {/* Birthdate */}
        <Input
          label="Data de nascimento"
          name="birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          hint="Necessário para desbloquear Open Finance e cartão"
        />

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-fg-muted)]">
            Biografia
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você"
            maxLength={200}
            rows={3}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
          />
          <span className="text-xs text-[var(--color-fg-subtle)]">{bio.length}/200</span>
        </div>

        <Button type="submit" fullWidth size="lg" loading={saving}>
          <Save size={18} /> Salvar alterações
        </Button>
      </form>

      {/* Export data */}
      <Card className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-fg)]">
              Exportar meus dados
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Baixe todos os seus dados em JSON
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={16} />
          </Button>
        </div>
      </Card>

      {/* Delete account */}
      <Card className="p-4 mt-3 border-[var(--color-error)]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-error)]">
              Excluir conta
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Esta ação não pode ser desfeita
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={16} /> {confirmDelete ? "Confirmar" : "Excluir"}
          </Button>
        </div>
        {confirmDelete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[var(--color-error)] mt-2"
          >
            Clique novamente para confirmar a exclusão permanente.
          </motion.p>
        )}
      </Card>
    </div>
  );
}

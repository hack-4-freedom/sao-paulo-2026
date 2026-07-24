import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/Mascot";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

type Step = "request" | "sent" | "reset" | "done";

export function ForgotPassword() {
  const { push } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
      return;
    }
    setStep("sent");
    push("success", "E-mail de recuperação enviado!");
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setError("Não foi possível atualizar a senha. Tente novamente.");
      return;
    }
    setStep("done");
    push("success", "Senha atualizada com sucesso!");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] safe-top safe-bottom">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        >
          <div className="mb-4">
            <Mascot size={56} expression="curious" />
          </div>

          {step === "request" && (
            <>
              <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-1">
                Esqueci minha senha
              </h1>
              <p className="text-sm text-[var(--color-fg-muted)] mb-8">
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                <Input
                  label="E-mail"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  leftSlot={<Mail size={18} />}
                  required
                  autoComplete="email"
                  error={error ?? undefined}
                />
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}

          {step === "sent" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[var(--color-success)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-fg)] mb-2">
                Verifique seu e-mail
              </h1>
              <p className="text-sm text-[var(--color-fg-muted)] mb-6 max-w-xs mx-auto">
                Enviamos um link de recuperação para <strong className="text-[var(--color-fg)]">{email}</strong>.
                Clique no link para definir uma nova senha.
              </p>
              <Button variant="secondary" fullWidth size="lg" onClick={() => setStep("reset")}>
                Já cliquei no link — definir nova senha
              </Button>
            </div>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-1">
                Nova senha
              </h1>
              <p className="text-sm text-[var(--color-fg-muted)] mb-8">
                Digite sua nova senha. Ela deve ter no mínimo 6 caracteres.
              </p>
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <Input
                  label="Nova senha"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  error={error ?? undefined}
                />
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Atualizar senha
                </Button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[var(--color-success)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-fg)] mb-2">
                Senha atualizada!
              </h1>
              <p className="text-sm text-[var(--color-fg-muted)] mb-6">
                Sua senha foi alterada com sucesso. Agora você pode entrar com a nova senha.
              </p>
              <Button fullWidth size="lg" onClick={() => navigate("/entrar")}>
                Ir para o login
              </Button>
            </div>
          )}

          {error && step === "request" && (
            <div className="flex items-center gap-2 mt-4 text-sm text-[var(--color-error)]">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Link
            to="/entrar"
            className="flex items-center justify-center gap-1 text-sm text-[var(--color-fg-muted)] text-center mt-6 hover:text-[var(--color-fg)] transition-colors"
          >
            <ArrowLeft size={16} /> Voltar para o login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

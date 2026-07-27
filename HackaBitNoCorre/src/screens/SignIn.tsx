import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function SignIn() {
  const { signIn } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    push("success", "Bem-vindo de volta!");
    navigate("/app");
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
            <Mascot size={56} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] mb-8">
            Entre para continuar aprendendo.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              leftSlot={<Lock size={18} />}
              required
              autoComplete="current-password"
              error={error ?? undefined}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Entrar
            </Button>
          </form>

          <p className="text-sm text-[var(--color-fg-muted)] text-center mt-6">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

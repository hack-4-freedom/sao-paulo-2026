import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function SignUp() {
  const { signUp } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    push("success", "Conta criada! Bem-vindo ao BIT NO CORRE.");
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
            Criar conta
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] mb-8">
            Leva menos de um minuto. É de graça.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Como te chamam?"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria"
              leftSlot={<UserIcon size={18} />}
              required
              autoComplete="name"
            />
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
              placeholder="Mínimo 6 caracteres"
              leftSlot={<Lock size={18} />}
              required
              autoComplete="new-password"
              error={error ?? undefined}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Criar conta
            </Button>
          </form>

          <p className="text-sm text-[var(--color-fg-muted)] text-center mt-6">
            Já tem conta?{" "}
            <Link
              to="/entrar"
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

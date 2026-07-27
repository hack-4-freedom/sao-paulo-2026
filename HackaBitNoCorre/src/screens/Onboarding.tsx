import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";

const slides = [
  {
    title: "Bitcoin sem complicação",
    text: "Aprenda com histórias do dia a dia. Sem termos difíceis, sem tecnicismo. Você vai entender dinheiro digital no seu ritmo.",
    bg: "from-[#F7931A]/15 to-transparent",
  },
  {
    title: "Aprender vale XP",
    text: "Cada lição completa e cada quiz acertado adiciona pontos de experiência (XP) ao seu perfil. Suba de nível e desbloqueie conquistas.",
    bg: "from-[#10B981]/15 to-transparent",
  },
  {
    title: "Três minutos por dia",
    text: "Leitura curta, quiz rápido, recompensa na hora. Mantenha o ritmo, suba de nível, desbloqueie conquistas.",
    bg: "from-[#3B82F6]/15 to-transparent",
  },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    navigate("/cadastro");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] safe-top safe-bottom">
      <div className="relative flex-1 flex flex-col">
        {/* Slide */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="flex flex-col items-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${slide.bg} -z-10`} />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                className="mb-8"
              >
                <Mascot size={88} animated expression={step === 2 ? "happy" : "curious"} />
              </motion.div>
              <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-3 max-w-xs">
                {slide.title}
              </h2>
              <p className="text-base text-[var(--color-fg-muted)] max-w-xs leading-relaxed">
                {slide.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-[var(--duration-base)] ${
                i === step
                  ? "w-8 bg-[var(--color-primary)]"
                  : "w-2 bg-[var(--color-surface-3)]"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <Button fullWidth size="lg" onClick={handleNext}>
            {isLast ? "Criar minha conta" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

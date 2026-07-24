import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { completeLesson } from "@/lib/rewards";
import { Sparkles } from "lucide-react";
import type { Lesson, QuizQuestion } from "@/lib/types";

type Phase = "loading" | "story" | "quiz" | "result" | "reward" | "error";

export function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();


  const [phase, setPhase] = useState<Phase>("loading");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{
    xp: number;
    perfect: boolean;
    alreadyDone: boolean;
  } | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setPhase("error");
          return;
        }
        setLesson(data as Lesson);
        setPhase("story");
      });
  }, [lessonId]);

  if (phase === "loading") {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 mb-4" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (phase === "error" || !lesson) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <p className="text-[var(--color-fg-muted)]">
          Não consegui carregar essa lição.
        </p>
        <Button className="mt-4" onClick={() => navigate("/app")}>
          Voltar
        </Button>
      </div>
    );
  }

  const totalSteps = lesson.story_frames.length + lesson.quiz.length;

  const handleStoryNext = () => {
    if (storyIndex < lesson.story_frames.length - 1) {
      setStoryIndex((i) => i + 1);
    } else {
      setPhase("quiz");
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (revealed) return;
    setSelected(optionIdx);
  };

  const handleQuizConfirm = async () => {
    if (selected === null || revealed) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setRevealed(true);

    const q = lesson.quiz[quizIndex] as QuizQuestion;
    if (selected === q.correct) {
      push("success", "Acertou!");
    }
  };

  const handleQuizNext = async () => {
    if (quizIndex < lesson.quiz.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    // Quiz done — complete the lesson
    setPhase("result");
    try {
      const r = await completeLesson(lesson, answers);
      setResult({
        xp: r.xpEarned,
        perfect: r.perfect,
        alreadyDone: r.alreadyCompleted,
      });
      setPhase("reward");
    } catch {
      push("error", "Algo deu errado ao salvar seu progresso.");
      setPhase("error");
    }
  };

  const currentStep =
    phase === "story" ? storyIndex + 1 : lesson.story_frames.length + quizIndex + 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] safe-top safe-bottom">
      {/* Top bar */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          aria-label="Sair"
        >
          <ArrowLeft size={18} />
        </button>
        <Progress
          value={currentStep}
          max={totalSteps}
          className="flex-1"
        />
        <span className="text-xs text-[var(--color-fg-subtle)] tabular-nums">
          {currentStep}/{totalSteps}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "story" && (
          <StoryView
            key={`story-${storyIndex}`}
            lesson={lesson}
            index={storyIndex}
            onNext={handleStoryNext}
          />
        )}
        {phase === "quiz" && (
          <QuizView
            key={`quiz-${quizIndex}`}
            lesson={lesson}
            index={quizIndex}
            selected={selected}
            revealed={revealed}
            onSelect={handleQuizAnswer}
            onConfirm={handleQuizConfirm}
            onNext={handleQuizNext}
          />
        )}
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        {phase === "reward" && result && (
          <RewardView
            key="reward"
            result={result}
            onContinue={() => navigate("/app")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryView({
  lesson,
  index,
  onNext,
}: {
  lesson: Lesson;
  index: number;
  onNext: () => void;
}) {
  const frame = lesson.story_frames[index];
  const isLast = index === lesson.story_frames.length - 1;
  const isNarrator = frame.narrator.toLowerCase() === "narrador";

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex-1 flex flex-col px-5"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="text-7xl mb-8"
          aria-hidden
        >
          {frame.emoji}
        </motion.div>
        {!isNarrator && (
          <span className="inline-block text-sm font-semibold text-[var(--color-primary)] mb-3 bg-[var(--color-primary-soft)] rounded-full px-3 py-1">
            {frame.narrator}
          </span>
        )}
        <p className="text-lg text-[var(--color-fg)] leading-relaxed max-w-sm">
          {frame.text}
        </p>
      </div>
      <div className="pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
        <Button fullWidth size="lg" onClick={onNext}>
          {isLast ? "Responder o quiz" : "Continuar"}
        </Button>
      </div>
    </motion.div>
  );
}

function QuizView({
  lesson,
  index,
  selected,
  revealed,
  onSelect,
  onConfirm,
  onNext,
}: {
  lesson: Lesson;
  index: number;
  selected: number | null;
  revealed: boolean;
  onSelect: (i: number) => void;
  onConfirm: () => void;
  onNext: () => void;
}) {
  const q = lesson.quiz[index] as QuizQuestion;
  const isLast = index === lesson.quiz.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex-1 flex flex-col px-5"
    >
      <div className="flex-1 flex flex-col pt-4">
        <span className="text-sm font-semibold text-[var(--color-primary)] mb-2">
          Pergunta {index + 1} de {lesson.quiz.length}
        </span>
        <h2 className="text-xl font-bold text-[var(--color-fg)] mb-6 leading-snug">
          {q.question}
        </h2>
        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.correct;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && isSelected && !isCorrect;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                disabled={revealed}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border text-left transition-all duration-[var(--duration-base)] ${
                  showCorrect
                    ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
                    : showWrong
                      ? "border-[var(--color-error)] bg-[var(--color-error-soft)]"
                      : isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    showCorrect
                      ? "bg-[var(--color-success)] text-white"
                      : showWrong
                        ? "bg-[var(--color-error)] text-white"
                        : isSelected
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                          : "bg-[var(--color-surface-2)] text-[var(--color-fg-subtle)]"
                  }`}
                >
                  {showCorrect ? (
                    <Check size={16} />
                  ) : showWrong ? (
                    <X size={16} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-base text-[var(--color-fg)] flex-1">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
            >
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                {q.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
        {!revealed ? (
          <Button
            fullWidth
            size="lg"
            disabled={selected === null}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        ) : (
          <Button fullWidth size="lg" variant="primary" onClick={onNext}>
            {isLast ? "Ver resultado" : "Próxima"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function RewardView({
  result,
  onContinue,
}: {
  result: { xp: number; perfect: boolean; alreadyDone: boolean };
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex-1 flex flex-col items-center justify-center px-5 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
        className="text-7xl mb-6"
        aria-hidden
      >
        🎉
      </motion.div>

      <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
        {result.perfect ? "Mandou bem!" : "Lição completa!"}
      </h2>
      <p className="text-sm text-[var(--color-fg-muted)] mb-8 max-w-xs">
        {result.alreadyDone
          ? "Você já concluiu esta lição. Vamos para a próxima!"
          : "Você ganhou pontos de experiência. Veja só:"}
      </p>

      {!result.alreadyDone && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 bg-[var(--color-secondary-soft)] text-[var(--color-secondary)] rounded-full px-5 py-2.5 font-bold mb-8"
        >
          <Sparkles size={18} />
          <span>+{result.xp} XP</span>
        </motion.div>
      )}

      <div className="w-full max-w-sm">
        <Button fullWidth size="lg" onClick={onContinue}>
          Continuar aprendendo
        </Button>
      </div>
    </motion.div>
  );
}

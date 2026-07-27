import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTrilhas, useTrilhaLessons } from "@/lib/hooks";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { Lesson, LessonProgress } from "@/lib/types";

export function TrilhaDetail() {
  const { trilhaId } = useParams();
  const navigate = useNavigate();
  const { trilhas, loading: trLoading, error: trError } = useTrilhas();
  const trilha = trilhas.find((t) => t.id === trilhaId);
  const { lessons, loading, error: lessonsError } = useTrilhaLessons(trilhaId);

  if (trError || lessonsError) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <button
          onClick={() => navigate("/app")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-fg-muted)] mb-4"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm text-[var(--color-error)] mb-4">
          {trError || lessonsError}
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Tentar de novo</Button>
      </div>
    );
  }

  if (trLoading || loading) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-8 w-10 mb-4" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!trilha) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <p className="text-[var(--color-fg-muted)]">Trilha não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate("/app")}>
          Voltar
        </Button>
      </div>
    );
  }

  const completed = lessons.filter((l) => l.progress?.status === "completed").length;
  const total = lessons.length;
  const next = lessons.find((l) => l.progress?.status !== "completed");

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
      <button
        onClick={() => navigate("/app")}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-fg-muted)] mb-4"
        aria-label="Voltar"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <span className="text-4xl" aria-hidden>{trilha.cover_emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-fg)]">
            {trilha.title}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">{trilha.subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--color-fg-muted)] mb-5 leading-relaxed">
        {trilha.description}
      </p>

      <div className="flex items-center gap-3 mb-6">
        <Progress value={completed} max={total} color={trilha.color_hex} />
        <span className="text-xs text-[var(--color-fg-muted)] whitespace-nowrap">
          {completed}/{total}
        </span>
      </div>

      {next && (
        <Button
          fullWidth
          size="lg"
          className="mb-6"
          onClick={() => navigate(`/app/licao/${next.id}`)}
        >
          {completed === 0 ? "Começar trilha" : "Continuar de onde parei"}
        </Button>
      )}

      <ul className="flex flex-col gap-2">
        {lessons.map((lesson, i) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            index={i}
            isUnlocked={
              lesson.progress?.status === "completed" ||
              lesson.id === next?.id
            }
          />
        ))}
      </ul>
    </div>
  );
}

function LessonItem({
  lesson,
  index,
  isUnlocked,
}: {
  lesson: Lesson & { progress?: LessonProgress };
  index: number;
  isUnlocked: boolean;
}) {
  const navigate = useNavigate();
  const isCompleted = lesson.progress?.status === "completed";

  return (
    <li>
      <Card
        interactive={isUnlocked}
        onClick={() => isUnlocked && navigate(`/app/licao/${lesson.id}`)}
        className={`p-4 flex items-center gap-3 ${
          isUnlocked ? "" : "opacity-50"
        }`}
      >
        <span className="text-2xl" aria-hidden>{lesson.cover_emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-fg)]">
            {index + 1}. {lesson.title}
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            {lesson.duration_min} min · {lesson.reward_xp} XP
          </p>
        </div>
        <span className="text-xs">
          {isCompleted ? "✓" : isUnlocked ? "▶" : "🔒"}
        </span>
      </Card>
    </li>
  );
}

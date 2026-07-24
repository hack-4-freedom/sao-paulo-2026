import { motion } from "framer-motion";

type MascotProps = {
  size?: number;
  className?: string;
  animated?: boolean;
  expression?: "curious" | "happy" | "celebrate" | "thinking";
};

/**
 * "Corre" — the BIT NO CORRE mascot.
 * A stylized, geometric fox-like guide representing curiosity, simplicity,
 * and evolution. Not infantile — clean lines, minimal, trustworthy.
 * Built as inline SVG for crispness at any size.
 */
export function Mascot({
  size = 48,
  className = "",
  animated = false,
  expression = "curious",
}: MascotProps) {
  const blinkY = expression === "happy" || expression === "celebrate" ? 0 : 2;
  const mouthPath =
    expression === "celebrate"
      ? "M 32 44 Q 40 52 48 44"
      : expression === "happy"
        ? "M 34 45 Q 40 49 46 45"
        : expression === "thinking"
          ? "M 36 46 Q 42 44 46 46"
          : "M 35 45 Q 40 48 45 45";

  const wrap = (children: React.ReactNode) =>
    animated ? (
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    ) : (
      <div className={className}>{children}</div>
    );

  return wrap(
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Corre, mascote do BIT NO CORRE"
    >
      {/* Ears */}
      <path d="M22 12 L28 30 L16 26 Z" fill="#F7931A" />
      <path d="M58 12 L52 30 L64 26 Z" fill="#F7931A" />
      <path d="M23 16 L26 26 L19 24 Z" fill="#FFA733" />
      <path d="M57 16 L54 26 L61 24 Z" fill="#FFA733" />

      {/* Head */}
      <circle cx="40" cy="42" r="22" fill="#F7931A" />

      {/* Face mask */}
      <path
        d="M 24 40 Q 40 52 56 40 L 56 48 Q 40 58 24 48 Z"
        fill="#FFF5E6"
        opacity="0.95"
      />

      {/* Eyes */}
      {expression === "celebrate" ? (
        <>
          <path d="M 30 38 L 34 34 L 34 42 Z" fill="#1A1F26" />
          <path d="M 50 38 L 46 34 L 46 42 Z" fill="#1A1F26" />
        </>
      ) : (
        <>
          <circle cx="31" cy="38" r="3" fill="#1A1F26" />
          <circle cx="49" cy="38" r="3" fill="#1A1F26" />
          <circle cx="32" cy={37 + blinkY} r="1" fill="#FFF" />
          <circle cx="50" cy={37 + blinkY} r="1" fill="#FFF" />
        </>
      )}

      {/* Nose */}
      <circle cx="40" cy="43" r="2" fill="#1A1F26" />

      {/* Mouth */}
      <path d={mouthPath} stroke="#1A1F26" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Cheek blush — subtle */}
      <circle cx="26" cy="45" r="2.5" fill="#FFB84D" opacity="0.5" />
      <circle cx="54" cy="45" r="2.5" fill="#FFB84D" opacity="0.5" />
    </svg>
  );
}

import { NavLink } from "react-router-dom";
import { Home, Wallet, User, Heart, Landmark } from "lucide-react";

const items = [
  { to: "/app", label: "Aprender", icon: Home, end: true },
  { to: "/app/games", label: "Apoie", icon: Heart, end: false },
  { to: "/app/carteira", label: "Carteira", icon: Wallet, end: false },
  { to: "/app/open-finance", label: "Finanças", icon: Landmark, end: false },
  { to: "/app/perfil", label: "Perfil", icon: User, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-bg-elevated)]/95 backdrop-blur-md border-t border-[var(--color-border)] safe-bottom"
      aria-label="Navegação principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors duration-[var(--duration-fast)] ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

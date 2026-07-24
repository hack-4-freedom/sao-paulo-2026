import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Splash } from "@/screens/Splash";
import { Onboarding } from "@/screens/Onboarding";
import { SignUp } from "@/screens/SignUp";
import { SignIn } from "@/screens/SignIn";
import { AppShell } from "@/screens/AppShell";
import { Home } from "@/screens/Home";
import { TrilhaDetail } from "@/screens/TrilhaDetail";
import { LessonPlayer } from "@/screens/LessonPlayer";
import { WalletScreen } from "@/screens/Wallet";
import { Missions } from "@/screens/Missions";
import { Profile } from "@/screens/Profile";
import { ProfileEdit } from "@/screens/ProfileEdit";
import { Referrals } from "@/screens/Referrals";
import { GameCenter } from "@/screens/GameCenter";
import { OpenFinance } from "@/screens/OpenFinance";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Onboarding /></PublicOnly>} />
      <Route path="/cadastro" element={<PublicOnly><SignUp /></PublicOnly>} />
      <Route path="/entrar" element={<PublicOnly><SignIn /></PublicOnly>} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="trilha/:trilhaId" element={<TrilhaDetail />} />
        <Route path="licao/:lessonId" element={<LessonPlayer />} />
        <Route path="missoes" element={<Missions />} />
        <Route path="carteira" element={<WalletScreen />} />
        <Route path="games" element={<GameCenter />} />
        <Route path="open-finance" element={<OpenFinance />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="perfil/editar" element={<ProfileEdit />} />
        <Route path="indicar" element={<Referrals />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

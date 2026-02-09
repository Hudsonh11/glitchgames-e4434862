import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Game from "./pages/Game";
import Recovery from "./pages/Recovery";
import NotFound from "./pages/NotFound";
import SupportBot from "@/components/SupportBot";
import OnlineStatus from "@/components/OnlineStatus";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OnlineStatus />
          <KeyboardShortcuts />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportBot />
        </TooltipProvider>
      </GameProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

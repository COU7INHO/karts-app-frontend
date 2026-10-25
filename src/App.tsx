import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import UploadPage from "./pages/Upload";
import RacesPage from "./pages/Races";
import RaceDetailPage from "./pages/RaceDetail";
import LeaderboardPage from "./pages/Leaderboard";
import DriversPage from "./pages/Drivers";
import DriverDetailPage from "./pages/DriverDetail";
import DriverEvolutionPage from "./pages/DriverEvolution";
import CircuitsPage from "./pages/Circuits";
import CircuitDetailPage from "./pages/CircuitDetail";
import LoginPage from "./pages/Login";
import ChampionshipsPage from "./pages/Championships";
import ChampionshipDetailPage from "./pages/ChampionshipDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/races" element={<RacesPage />} />
              <Route path="/races/:id" element={<RaceDetailPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/:id" element={<DriverDetailPage />} />
              <Route path="/drivers/:id/evolution" element={<DriverEvolutionPage />} />
              <Route path="/circuits" element={<CircuitsPage />} />
              <Route path="/circuits/:id" element={<CircuitDetailPage />} />
              <Route path="/championships" element={<ChampionshipsPage />} />
              <Route path="/championships/:id" element={<ChampionshipDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

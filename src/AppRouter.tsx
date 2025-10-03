import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import { ZapGoalsPage } from "./pages/ZapGoalsPage";
import { ZapGoalDetailPage } from "./pages/ZapGoalDetailPage";
import { CreateZapGoalPage } from "./pages/CreateZapGoalPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/goals" element={<ZapGoalsPage />} />
        <Route path="/goals/create" element={<CreateZapGoalPage />} />
        <Route path="/goals/:id" element={<ZapGoalDetailPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
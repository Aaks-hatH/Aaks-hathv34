import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '@/pages/Home';
import ProjectDetail from '@/pages/ProjectDetail';
import ToolsDashboard from '@/pages/ToolsDashboard';
import Admin from '@/pages/Admin';
import HUD from '@/pages/HUD'; // <--- 1. IMPORT THIS
import KonamiCode from '@/components/portfolio/KonamiCode';
import GlobalTracker from '@/components/GlobalTracker';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalTracker />
        <KonamiCode />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/ProjectDetail" element={<ProjectDetail />} />
          <Route path="/tools" element={<ToolsDashboard />} />
          <Route path="/admin" element={<Admin />} />
          
          {/* 2. ADD THIS ROUTE */}
          <Route path="/hud" element={<HUD />} />
          
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

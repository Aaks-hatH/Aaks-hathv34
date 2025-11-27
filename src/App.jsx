import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '@/pages/Home';
import ProjectDetail from '@/pages/ProjectDetail';
import ToolsDashboard from '@/pages/ToolsDashboard'; // <--- Make sure this imports ToolsDashboard
import KonamiCode from '@/components/portfolio/KonamiCode';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KonamiCode />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/ProjectDetail" element={<ProjectDetail />} />
          
          {/* 👇 THIS IS THE KEY CHANGE. It must say ToolsDashboard, not OsintTools */}
          <Route path="/tools" element={<ToolsDashboard />} />
          
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
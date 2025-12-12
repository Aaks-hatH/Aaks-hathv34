import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '@/pages/Home';
import ProjectDetail from '@/pages/ProjectDetail';
import ToolsDashboard from '@/pages/ToolsDashboard';
import Admin from '@/pages/Admin';
import HUD from '@/pages/HUD';
import KonamiCode from '@/components/portfolio/KonamiCode';
import GlobalTracker from '@/components/GlobalTracker';
import LandingGate from '@/components/LandingGate'; // <--- IMPORT

const queryClient = new QueryClient();

function App() {
  // Check if they already verified in this session
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('security_clearance');
    if (hasAccess === 'granted') setVerified(true);
  }, []);

  const handleVerify = () => {
    sessionStorage.setItem('security_clearance', 'granted');
    setVerified(true);
  };

  // 1. SHOW GATE IF NOT VERIFIED
  if (!verified) {
    return <LandingGate onVerify={handleVerify} />;
  }

  // 2. SHOW SITE IF VERIFIED
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
          <Route path="/hud" element={<HUD />} />
          <Route path="/login" element={<FakeLogin />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

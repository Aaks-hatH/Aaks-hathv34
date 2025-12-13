import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Home from '@/pages/Home';
import ProjectDetail from '@/pages/ProjectDetail';
import ToolsDashboard from '@/pages/ToolsDashboard';
import Admin from '@/pages/Admin';
import HUD from '@/pages/HUD';
import FakeLogin from '@/pages/FakeLogin';
import NotFound from '@/pages/NotFound';

// Components
import KonamiCode from '@/components/portfolio/KonamiCode';
import GlobalTracker from '@/components/GlobalTracker';
import LandingGate from '@/components/LandingGate';
import AntiTamper from '@/components/AntiTamper';
import CyberDock from '@/components/CyberDock'; // <--- NEW IMPORT

const queryClient = new QueryClient();

function App() {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('security_clearance');
    if (hasAccess === 'granted') setVerified(true);
  }, []);

  const handleVerify = () => {
    sessionStorage.setItem('security_clearance', 'granted');
    setVerified(true);
  };

  if (!verified) {
    return <LandingGate onVerify={handleVerify} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* GLOBAL LAYERS */}
        <GlobalTracker />
        <AntiTamper />
        <KonamiCode />
        <CyberDock /> {/* <--- NEW: Floating Nav Bar */}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/ProjectDetail" element={<ProjectDetail />} />
          <Route path="/tools" element={<ToolsDashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/hud" element={<HUD />} />
          <Route path="/login" element={<FakeLogin />} />
          
          {/* CATCH ALL 404 ROUTE (MUST BE LAST) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

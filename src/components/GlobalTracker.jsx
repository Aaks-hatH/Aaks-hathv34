import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, Lock } from 'lucide-react';

export default function GlobalTracker() {
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [guestId] = useState(`GUEST-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    // 1. LISTEN FOR MAINTENANCE LOCKDOWN
    const checkLock = async () => {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (data && data.value === 'true') setLocked(true);
    };

    checkLock();

    const lockSubscription = supabase
      .channel('system-locks')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, (payload) => {
        if (payload.new.key === 'maintenance_mode') {
          setLocked(payload.new.value === 'true');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lockSubscription);
    };
  }, []);

  useEffect(() => {
    // 2. BROADCAST LOCATION TO ADMIN (THE "SPY" PART)
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: guestId,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: guestId,
          path: location.pathname,
          timestamp: new Date().toISOString(),
          ua: navigator.userAgent // Browser info
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location, guestId]);

  if (locked && !location.pathname.includes('/admin')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-600 font-mono p-4">
        <div className="text-center space-y-4 border border-red-900 p-10 bg-red-950/10">
          <ShieldAlert className="w-20 h-20 mx-auto animate-pulse" />
          <h1 className="text-4xl font-bold tracking-widest">SYSTEM LOCKDOWN</h1>
          <p className="text-sm">ADMINISTRATOR HAS SUSPENDED PUBLIC ACCESS.</p>
          <div className="text-xs text-red-800 mt-8">ERROR_CODE: 503_SERVICE_HALTED</div>
        </div>
      </div>
    );
  }

  return null; // Invisible otherwise
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Settings = {
  is_booking_open: boolean;
  max_tokens: number;
  current_token: number;
};

export default function LiveTracker() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('public_status').select('*').single();
      if (data) setSettings(data as Settings);
      setBookedCount((data as any)?.booked_count ?? null);
    };
    load();

    const channel = supabase
      .channel('public-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!settings) {
    return <div className="card animate-pulse text-center text-clinic-teal/50">Loading today's status…</div>;
  }

  return (
    <div className="card text-center space-y-3">
      <p className="text-sm uppercase tracking-wide text-clinic-teal/70">Now serving</p>
      <div className="token-badge">{settings.current_token || '—'}</div>
      
      <div className="pt-2 border-t border-clinic-teal/10">
        {settings.is_booking_open ? (
          <p className="text-clinic-teal font-medium">
            {bookedCount !== null ? `${bookedCount} / ${settings.max_tokens} tokens booked today` : 'Booking open'}
          </p>
        ) : (
          <p className="text-clinic-amber font-medium">Booking closed for today</p>
        )}
      </div>
    </div>
  );
}

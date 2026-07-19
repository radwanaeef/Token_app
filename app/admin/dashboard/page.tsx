'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Booking = {
  id: string;
  token_number: number;
  patient_name: string;
  phone_number: string;
  status: string;
};

type Settings = {
  is_booking_open: boolean;
  current_token: number;
  max_tokens: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockPhone, setBlockPhone] = useState('');

  const loadData = async () => {
    const { data: s } = await supabase.from('system_settings').select('*').single();
    setSettings(s as Settings);
    const { data: b } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', new Date().toISOString().slice(0, 10))
      .order('token_number');
    setBookings((b as Booking[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/admin/login');
    });
    loadData();
  }, []);

  const toggleBooking = async () => {
    if (!settings) return;
    await supabase.from('system_settings').update({ is_booking_open: !settings.is_booking_open }).eq('id', 1);
    loadData();
  };

  const nextPatient = async () => {
    await supabase.rpc('increment_token');
    loadData();
  };

  const blacklistNumber = async (phone: string) => {
    await supabase.from('blacklist').insert({ phone_number: phone, reason: 'Flagged by staff' });
    setBlockPhone('');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (!settings) return <p className="text-center pt-10">Loading…</p>;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between pt-2">
        <h1 className="font-display text-xl font-bold text-clinic-tealDark">Admin Dashboard</h1>
        <button onClick={signOut} className="text-sm text-clinic-coral underline">
          Sign out
        </button>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Booking window</span>
          <button
            onClick={toggleBooking}
            className={`px-4 py-2 rounded-lg font-semibold text-white ${
              settings.is_booking_open ? 'bg-clinic-coral' : 'bg-clinic-teal'
            }`}
          >
            {settings.is_booking_open ? 'Close Booking' : 'Open Booking'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Now serving</span>
          <span className="token-badge" style={{ width: '3.5rem', height: '3.5rem', fontSize: '1.5rem' }}>
            {settings.current_token}
          </span>
        </div>
        <button onClick={nextPatient} className="btn-primary">
          Next Patient →
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Block a phone number</h2>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="10-digit number"
            value={blockPhone}
            onChange={(e) => setBlockPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
          <button
            onClick={() => blacklistNumber(blockPhone)}
            disabled={blockPhone.length !== 10}
            className="px-4 rounded-xl bg-clinic-ink text-white font-semibold disabled:opacity-40"
          >
            Block
          </button>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">
          Today's Patients ({bookings.length}/{settings.max_tokens})
        </h2>
        <div className="divide-y divide-clinic-teal/10">
          {bookings.map((b) => (
            <div key={b.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  #{b.token_number} — {b.patient_name}
                </p>
                <p className="text-sm text-clinic-ink/50">{b.phone_number}</p>
              </div>
              <button
                onClick={() => blacklistNumber(b.phone_number)}
                className="text-xs text-clinic-coral underline"
              >
                Block
              </button>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-clinic-ink/40 text-sm py-4 text-center">No bookings yet today.</p>
          )}
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ERROR_MESSAGES: Record<string, string> = {
  FULLY_BOOKED: "Fully Booked for Today. Please try again tomorrow after 7:00 AM.",
  ALREADY_BOOKED: "This mobile number already has a token booked for today.",
  BOOKING_CLOSED: "Booking isn't open right now. It opens daily at 7:00 AM.",
  BLOCKED: "We couldn't complete this booking. Please visit the clinic desk directly.",
};

export default function BookPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hp, setHp] = useState(''); // honeypot — real users never fill this
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidPhone = /^[0-9]{10}$/.test(phone.trim());
  const isValid = name.trim().length >= 2 && isValidPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // silently drop bot submissions
    if (!isValid) return;

    setLoading(true);
    setError('');

    const { data, error: rpcError } = await supabase.rpc('book_token', {
      p_name: name.trim(),
      p_phone: phone.trim(),
    });

    setLoading(false);

    if (rpcError) {
      const key = Object.keys(ERROR_MESSAGES).find((k) => rpcError.message.includes(k));
      setError(key ? ERROR_MESSAGES[key] : 'Something went wrong. Please try again.');
      return;
    }

    const row = data?.[0];
    const params = new URLSearchParams({
      name: name.trim(),
      phone: phone.trim(),
    });
    router.push(`/ticket/${row.token_number}?${params.toString()}`);
  };

  return (
    <main className="space-y-6">
      <h1 className="font-display text-xl font-bold text-clinic-tealDark text-center pt-2">
        Book Your Token
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mobile Number</label>
          <input
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>

        {/* honeypot field — hidden from real users via CSS, bots often fill it */}
        <input
          type="text"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {error && (
          <p className="text-clinic-coral text-sm font-medium bg-clinic-coral/10 rounded-lg p-3">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={!isValid || loading}>
          {loading ? 'Booking…' : 'Confirm Booking'}
        </button>
      </form>

      <p className="text-center text-sm text-clinic-ink/50">One token per mobile number, per day.</p>
    </main>
  );
}

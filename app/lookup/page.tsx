'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LookupPage() {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data } = await supabase.rpc('get_my_token', { p_phone: phone.trim() });
    setLoading(false);
    if (data && data.length > 0) setResult(data[0]);
    else setNotFound(true);
  };

  return (
    <main className="space-y-6">
      <h1 className="font-display text-xl font-bold text-clinic-tealDark text-center pt-2">
        Check My Token
      </h1>

      <div className="card space-y-4">
        <input
          className="input-field"
          placeholder="Enter your mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
        />
        <button onClick={handleLookup} className="btn-primary" disabled={phone.length !== 10 || loading}>
          {loading ? 'Checking…' : 'Find My Token'}
        </button>

        {notFound && (
          <p className="text-clinic-coral text-sm text-center">
            No token found for this number today.
          </p>
        )}

        {result && (
          <div className="text-center space-y-2 pt-2">
            <div className="token-badge">{result.token_number}</div>
            <p className="font-semibold">{result.patient_name}</p>
            <p className="text-clinic-teal">
              Valid for: {new Date(result.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      <Link href="/" className="block text-center text-clinic-teal underline">
        Back to Live Queue
      </Link>
    </main>
  );
}

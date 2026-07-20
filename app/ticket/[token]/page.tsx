'use client';

import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

export default function TicketPage() {
  const params = useParams();
  const search = useSearchParams();
  const token = params.token as string;
  const name = search.get('name') ?? '';
  const bookingDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const ticketUrl = `${siteUrl}/`;
  const shareText = encodeURIComponent(
    `Sunrise Clinic token booked ✅\nName: ${name}\nToken No: ${token}\nValid for: ${bookingDate}\nTrack live queue: ${ticketUrl}`
  );

  return (
    <main className="space-y-6">
      <h1 className="font-display text-xl font-bold text-clinic-tealDark text-center pt-2">
        You're Booked
      </h1>

      <div className="card text-center space-y-4">
        <div className="token-badge">{token}</div>
        <div>
          <p className="text-clinic-ink/60 text-sm">Patient</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
        <div>
          <p className="text-clinic-ink/60 text-sm">Valid For</p>
          <p className="text-lg font-semibold text-clinic-teal">{bookingDate}</p>
        </div>
        <p className="text-sm text-clinic-ink/50">
          Keep this token. You don't need to wait at the clinic — check the live queue from home.
        </p>
      </div>

      <a
        href={`https://wa.me/?text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp block"
      >
        Save / Share on WhatsApp
      </a>

      <Link href="/" className="block text-center text-clinic-teal font-medium underline">
        View Live Queue
      </Link>
    </main>
  );
}

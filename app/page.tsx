import Link from 'next/link';
import LiveTracker from '@/components/LiveTracker';

export default function Home() {
  return (
    <main className="space-y-6">
      <header className="text-center pt-2 pb-1">
        <h1 className="font-display text-2xl font-bold text-clinic-tealDark">Sunrise Clinic</h1>
        <p className="text-clinic-ink/60 text-base">Daily consultation tokens</p>
      </header>

      <LiveTracker />

      <Link href="/book" className="btn-primary block text-center">
        Book Today's Token
      </Link>

      <p className="text-center text-sm text-clinic-ink/50 px-2">
        Already booked? Check the number above from home — no need to wait at the clinic.
      </p>
      <Link href="/admin/login" className="block text-center text-sm text-clinic-ink/40 pt-4">
  Staff Login
</Link>
    </main>
  );
}

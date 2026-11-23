import Link from 'next/link';

export default function NotFound() {
  return <main className="section narrow">
    <p className="eyebrow">404</p>
    <h1>Page unavailable</h1>
    <p>The link may be incorrect or the service may have moved.</p>
    <Link href="/services" className="button">Browse salon services</Link>
  </main>;
}

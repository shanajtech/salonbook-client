import { notFound } from 'next/navigation';
import SalonBook from './SalonBook';

const customerSections = new Set(['overview', 'my-appointments', 'my-profile']);
const adminSections = new Set(['overview', 'manage-services', 'add-service', 'manage-appointments', 'manage-users', 'transactions', 'my-profile']);

function validRoute(parts) {
  const [page, subpage, section] = parts;
  if (!page) return true;
  if (parts.length === 1) return ['services', 'sign-in', 'sign-up', 'dashboard'].includes(page);
  if (page === 'services') return parts.length === 2 && /^[a-f\d]{24}$/i.test(subpage);
  if (page === 'payment') return parts.length === 2 && ['success', 'cancel'].includes(subpage);
  if (page !== 'dashboard' || parts.length > 3) return false;
  const allowed = subpage === 'admin' ? adminSections : subpage === 'customer' ? customerSections : null;
  return Boolean(allowed && (!section || allowed.has(section)));
}

export default async function RoutePage({ params }) {
  const { route = [] } = await params;
  if (!validRoute(route)) notFound();
  return <SalonBook />;
}

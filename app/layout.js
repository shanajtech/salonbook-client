import './style.css';
export const metadata = { title: 'SalonBook | Find your next appointment', description: 'Explore salon services and book your next visit.' };
export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}


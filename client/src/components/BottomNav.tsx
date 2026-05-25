import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, History, Dumbbell } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/program', icon: ClipboardList, label: 'Program', exact: false },
  { to: '/history', icon: History, label: 'History', exact: false },
];

export default function BottomNav() {
  const location = useLocation();
  // Hide nav during active workout
  if (location.pathname.startsWith('/workout/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-green-400' : 'text-zinc-500'
              }`
            }
          >
            <Icon size={22} strokeWidth={isActive(to, exact, location.pathname) ? 2.5 : 1.8} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function isActive(to: string, exact: boolean, pathname: string) {
  return exact ? pathname === to : pathname.startsWith(to);
}

import { Link, useLocation } from 'react-router-dom';
import type { User } from '../lib/api';
import {
  LayoutDashboard,
  Compass,
  PieChart,
  Zap,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  user: User | null;
}

const NAV_ITEMS = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Home'    },
  { to: '/ideas',                icon: Compass,         label: 'Explore' },
  { to: '/cap-table',            icon: PieChart,        label: 'Equity'  },
  { to: '/matchmaker',           icon: Zap,             label: 'Matches' },
  { to: '/chat',                 icon: MessageSquare,   label: 'Chat'    },
];

export default function Sidebar({ user }: SidebarProps) {
  const { pathname } = useLocation();
  if (!user) return null;

  const items = NAV_ITEMS.filter(item => {
    if (item.to === '/cap-table' && user.role !== 'founder') {
      return false;
    }
    return true;
  });

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <nav className="sidebar-nav">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to ||
            (to === '/dashboard' && pathname.startsWith('/dashboard')) ||
            (to === '/cap-table' && ['/cap-table', '/term-sheets', '/vesting'].includes(pathname)) ||
            (to === '/ideas' && ['/ideas', '/feed'].includes(pathname));
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`sidebar-link ${active ? 'sidebar-link-active' : 'sidebar-link-idle'}`}
            >
              <Icon className="w-[17px] h-[17px] flex-shrink-0" />
              <span className="sidebar-label">{label}</span>
              {active && <span className="sidebar-active-bar" />}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

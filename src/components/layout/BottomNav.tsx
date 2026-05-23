import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  FolderOpen,
  ScrollText,
  Activity,
  Server,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dash' },
  { path: '/sessions', icon: Server, label: 'Sessions' },
  { path: '/terminal', icon: Terminal, label: 'Term' },
  { path: '/files', icon: FolderOpen, label: 'Files' },
  { path: '/logs', icon: ScrollText, label: 'Logs' },
  { path: '/stats', icon: Activity, label: 'Stats' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#151922] border-t border-[#262c36]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors duration-150 ${
                isActive
                  ? 'text-[#4fa3ff]'
                  : 'text-[#8b93a7]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

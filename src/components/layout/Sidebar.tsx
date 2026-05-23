import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  FolderOpen,
  ScrollText,
  Activity,
  Server,
} from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { useSessions } from '@/hooks/useSessions';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sessions', icon: Server, label: 'Sessions' },
  { path: '/terminal', icon: Terminal, label: 'Terminal' },
  { path: '/files', icon: FolderOpen, label: 'Files' },
  { path: '/logs', icon: ScrollText, label: 'Logs' },
  { path: '/stats', icon: Activity, label: 'Stats' },
];

export function Sidebar() {
  const location = useLocation();
  const stats = useStats();
  const { sessions } = useSessions();
  const runningCount = sessions.filter(s => s.status === 'running').length;

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-[#151922] border-r border-[#262c36] h-screen fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#262c36]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#4fa3ff]/10 rounded flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#4fa3ff]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#d6dbe4] leading-tight">TERMUX PANEL</h1>
            <p className="text-[10px] text-[#8b93a7] font-mono">RUNTIME CONTROL</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-[#4fa3ff]/10 text-[#4fa3ff]'
                  : 'text-[#8b93a7] hover:text-[#d6dbe4] hover:bg-[#1a1f2a]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.path === '/sessions' && (
                <span className="ml-auto text-[10px] font-mono bg-[#262c36] px-1.5 py-0.5 rounded text-[#8b93a7]">
                  {runningCount}/{sessions.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="px-3 py-3 border-t border-[#262c36] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#8b93a7]">CPU</span>
          <span className={stats.cpu.usage > 80 ? 'text-[#ff6b6b]' : stats.cpu.usage > 50 ? 'text-[#e5a044]' : 'text-[#57c27e]'}>
            {stats.cpu.usage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-[#0f1115] rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              stats.cpu.usage > 80 ? 'bg-[#ff6b6b]' : stats.cpu.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'
            }`}
            style={{ width: `${Math.min(stats.cpu.usage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#8b93a7]">RAM</span>
          <span className={stats.memory.usage > 80 ? 'text-[#ff6b6b]' : stats.memory.usage > 50 ? 'text-[#e5a044]' : 'text-[#57c27e]'}>
            {stats.memory.usage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-[#0f1115] rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              stats.memory.usage > 80 ? 'bg-[#ff6b6b]' : stats.memory.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'
            }`}
            style={{ width: `${Math.min(stats.memory.usage, 100)}%` }}
          />
        </div>
        <div className="pt-1 border-t border-[#262c36] flex items-center justify-between text-[10px] font-mono text-[#8b93a7]">
          <span>{stats.os.hostname}</span>
          <span className="text-[#57c27e]">●</span>
        </div>
      </div>
    </aside>
  );
}

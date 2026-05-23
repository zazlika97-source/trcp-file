import { useStats } from '@/hooks/useStats';
import { useSessions } from '@/hooks/useSessions';
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Play,
  Square,
  AlertTriangle,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function Dashboard() {
  const stats = useStats();
  const { sessions } = useSessions();

  const runningCount = sessions.filter(s => s.status === 'running').length;
  const stoppedCount = sessions.filter(s => s.status === 'stopped').length;
  const errorCount = sessions.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#d6dbe4]">Dashboard</h1>
          <p className="text-xs text-[#8b93a7] font-mono mt-0.5">
            {stats.os.hostname} · {stats.os.platform} · {stats.os.distro}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8b93a7] font-mono">Uptime</p>
          <p className="text-sm font-mono text-[#d6dbe4]">{formatUptime(stats.os.uptime)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CPU */}
        <div className="panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-xs text-[#8b93a7]">CPU</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#d6dbe4]">{stats.cpu.usage.toFixed(0)}%</p>
          <div className="mt-2 w-full bg-[#0f1115] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stats.cpu.usage > 80 ? 'bg-[#ff6b6b]' : stats.cpu.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'
              }`}
              style={{ width: `${Math.min(stats.cpu.usage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8b93a7] font-mono mt-1">{stats.cpu.cores} cores</p>
        </div>

        {/* Memory */}
        <div className="panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-xs text-[#8b93a7]">RAM</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#d6dbe4]">{stats.memory.usage}%</p>
          <div className="mt-2 w-full bg-[#0f1115] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stats.memory.usage > 80 ? 'bg-[#ff6b6b]' : stats.memory.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'
              }`}
              style={{ width: `${Math.min(stats.memory.usage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8b93a7] font-mono mt-1">
            {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
          </p>
        </div>

        {/* Storage */}
        <div className="panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-xs text-[#8b93a7]">Storage</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#d6dbe4]">{stats.storage.usage}%</p>
          <div className="mt-2 w-full bg-[#0f1115] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stats.storage.usage > 80 ? 'bg-[#ff6b6b]' : stats.storage.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'
              }`}
              style={{ width: `${Math.min(stats.storage.usage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8b93a7] font-mono mt-1">
            {formatBytes(stats.storage.used)} / {formatBytes(stats.storage.total)}
          </p>
        </div>

        {/* Network */}
        <div className="panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-xs text-[#8b93a7]">Network</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-mono text-[#d6dbe4]">
              ↓ {formatBytes(stats.network.rxSec)}/s
            </p>
            <p className="text-sm font-mono text-[#d6dbe4]">
              ↑ {formatBytes(stats.network.txSec)}/s
            </p>
          </div>
          <p className="text-[10px] text-[#8b93a7] font-mono mt-1">
            RX: {formatBytes(stats.network.rx)} · TX: {formatBytes(stats.network.tx)}
          </p>
        </div>
      </div>

      {/* Sessions Overview */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-sm font-medium text-[#d6dbe4]">Sessions Overview</span>
          </div>
          <span className="text-xs text-[#8b93a7] font-mono">{sessions.length} total</span>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0f1115] rounded p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Play className="w-3.5 h-3.5 text-[#57c27e]" />
                <span className="text-xs text-[#8b93a7]">Running</span>
              </div>
              <p className="text-2xl font-mono font-semibold text-[#57c27e]">{runningCount}</p>
            </div>
            <div className="bg-[#0f1115] rounded p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Square className="w-3.5 h-3.5 text-[#8b93a7]" />
                <span className="text-xs text-[#8b93a7]">Stopped</span>
              </div>
              <p className="text-2xl font-mono font-semibold text-[#8b93a7]">{stoppedCount}</p>
            </div>
            <div className="bg-[#0f1115] rounded p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff6b6b]" />
                <span className="text-xs text-[#8b93a7]">Error</span>
              </div>
              <p className="text-2xl font-mono font-semibold text-[#ff6b6b]">{errorCount}</p>
            </div>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-xs text-[#8b93a7] font-mono mb-2">RECENT SESSIONS</p>
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 px-3 bg-[#0f1115] rounded hover-row"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        session.status === 'running'
                          ? 'bg-[#57c27e]'
                          : session.status === 'error'
                          ? 'bg-[#ff6b6b]'
                          : session.status === 'starting'
                          ? 'bg-[#4fa3ff]'
                          : 'bg-[#8b93a7]'
                      }`}
                    />
                    <span className="text-sm text-[#d6dbe4] truncate">{session.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-[#8b93a7] font-mono hidden sm:inline">
                      {session.command}
                    </span>
                    <span className={`text-xs font-mono ${
                      session.status === 'running' ? 'status-running' :
                      session.status === 'error' ? 'status-error' :
                      session.status === 'starting' ? 'status-starting' :
                      'status-stopped'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Temperature */}
      {stats.temperature !== null && (
        <div className="panel p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#e5a044]" />
              <span className="text-xs text-[#8b93a7]">CPU Temperature</span>
            </div>
            <span className={`text-sm font-mono font-semibold ${
              (stats.temperature || 0) > 80 ? 'text-[#ff6b6b]' :
              (stats.temperature || 0) > 60 ? 'text-[#e5a044]' :
              'text-[#57c27e]'
            }`}>
              {stats.temperature?.toFixed(0)}°C
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

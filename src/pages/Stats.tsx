import { useStats } from '@/hooks/useStats';
import { useSessions } from '@/hooks/useSessions';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Thermometer,
  Globe,
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
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-[#0f1115] rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function StatsPage() {
  const stats = useStats();
  const { sessions } = useSessions();
  const runningCount = sessions.filter(s => s.status === 'running').length;

  const cpuColor = stats.cpu.usage > 80 ? 'bg-[#ff6b6b]' : stats.cpu.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]';
  const ramColor = stats.memory.usage > 80 ? 'bg-[#ff6b6b]' : stats.memory.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]';
  const storageColor = stats.storage.usage > 80 ? 'bg-[#ff6b6b]' : stats.storage.usage > 50 ? 'bg-[#e5a044]' : 'bg-[#57c27e]';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[#d6dbe4]">System Stats</h1>
        <p className="text-xs text-[#8b93a7] font-mono mt-0.5">
          {stats.os.hostname} · {stats.os.distro} {stats.os.release}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CPU */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#4fa3ff]" />
              <span className="text-sm font-medium text-[#d6dbe4]">CPU</span>
            </div>
            <span className="text-2xl font-mono font-bold text-[#d6dbe4]">{stats.cpu.usage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={stats.cpu.usage} color={cpuColor} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#8b93a7]">Model:</span>
              <span className="text-[#d6dbe4] font-mono ml-1">{stats.cpu.model}</span>
            </div>
            <div>
              <span className="text-[#8b93a7]">Cores:</span>
              <span className="text-[#d6dbe4] font-mono ml-1">{stats.cpu.cores}</span>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-[#4fa3ff]" />
              <span className="text-sm font-medium text-[#d6dbe4]">Memory</span>
            </div>
            <span className="text-2xl font-mono font-bold text-[#d6dbe4]">{stats.memory.usage}%</span>
          </div>
          <ProgressBar value={stats.memory.usage} color={ramColor} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <p className="text-[#8b93a7]">Total</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.memory.total)}</p>
            </div>
            <div>
              <p className="text-[#8b93a7]">Used</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.memory.used)}</p>
            </div>
            <div>
              <p className="text-[#8b93a7]">Free</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.memory.free)}</p>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#4fa3ff]" />
              <span className="text-sm font-medium text-[#d6dbe4]">Storage</span>
            </div>
            <span className="text-2xl font-mono font-bold text-[#d6dbe4]">{stats.storage.usage}%</span>
          </div>
          <ProgressBar value={stats.storage.usage} color={storageColor} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <p className="text-[#8b93a7]">Total</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.storage.total)}</p>
            </div>
            <div>
              <p className="text-[#8b93a7]">Used</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.storage.used)}</p>
            </div>
            <div>
              <p className="text-[#8b93a7]">Free</p>
              <p className="font-mono text-[#d6dbe4]">{formatBytes(stats.storage.free)}</p>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-5 h-5 text-[#4fa3ff]" />
            <span className="text-sm font-medium text-[#d6dbe4]">Network</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1115] rounded p-2">
              <p className="text-[10px] text-[#8b93a7] mb-1">RX (Received)</p>
              <p className="text-sm font-mono text-[#57c27e]">{formatBytes(stats.network.rx)}</p>
              <p className="text-[10px] font-mono text-[#8b93a7]">{formatBytes(stats.network.rxSec)}/s</p>
            </div>
            <div className="bg-[#0f1115] rounded p-2">
              <p className="text-[10px] text-[#8b93a7] mb-1">TX (Sent)</p>
              <p className="text-sm font-mono text-[#4fa3ff]">{formatBytes(stats.network.tx)}</p>
              <p className="text-[10px] font-mono text-[#8b93a7]">{formatBytes(stats.network.txSec)}/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Temperature */}
      {stats.temperature !== null && (
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-[#e5a044]" />
              <span className="text-sm font-medium text-[#d6dbe4]">CPU Temperature</span>
            </div>
            <span className={`text-2xl font-mono font-bold ${
              (stats.temperature || 0) > 80 ? 'text-[#ff6b6b]' :
              (stats.temperature || 0) > 60 ? 'text-[#e5a044]' :
              'text-[#57c27e]'
            }`}>
              {stats.temperature?.toFixed(1)}°C
            </span>
          </div>
          <ProgressBar
            value={stats.temperature || 0}
            max={100}
            color={(stats.temperature || 0) > 80 ? 'bg-[#ff6b6b]' : (stats.temperature || 0) > 60 ? 'bg-[#e5a044]' : 'bg-[#57c27e]'}
          />
        </div>
      )}

      {/* System Info */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#4fa3ff]" />
            <span className="text-sm font-medium text-[#d6dbe4]">System Information</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#8b93a7]">Platform:</span>
              <p className="font-mono text-[#d6dbe4] capitalize">{stats.os.platform}</p>
            </div>
            <div>
              <span className="text-[#8b93a7]">Distribution:</span>
              <p className="font-mono text-[#d6dbe4]">{stats.os.distro}</p>
            </div>
            <div>
              <span className="text-[#8b93a7]">Release:</span>
              <p className="font-mono text-[#d6dbe4]">{stats.os.release}</p>
            </div>
            <div>
              <span className="text-[#8b93a7]">Hostname:</span>
              <p className="font-mono text-[#d6dbe4]">{stats.os.hostname}</p>
            </div>
            <div>
              <span className="text-[#8b93a7]">Uptime:</span>
              <p className="font-mono text-[#d6dbe4]">{formatUptime(stats.os.uptime)}</p>
            </div>
            <div>
              <span className="text-[#8b93a7]">Active Sessions:</span>
              <p className="font-mono text-[#d6dbe4]">{runningCount} running</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

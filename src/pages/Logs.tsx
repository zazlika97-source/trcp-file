import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { LogEntry } from '@/types';
import {
  ScrollText,
  Trash2,
  Pause,
  Play,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
} from 'lucide-react';

function formatTime(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
}

const LEVEL_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const LEVEL_COLORS = {
  info: 'text-[#d6dbe4]',
  warn: 'text-[#e5a044]',
  error: 'text-[#ff6b6b]',
  success: 'text-[#57c27e]',
};

const LEVEL_BG = {
  info: '',
  warn: 'bg-[#e5a044]/5',
  error: 'bg-[#ff6b6b]/5',
  success: 'bg-[#57c27e]/5',
};

export function LogsPage() {
  const { on, off, connected } = useSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterSession, setFilterSession] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxLogs = 1000;

  useEffect(() => {
    if (!connected) return;

    const handleLog = (entry: LogEntry) => {
      if (paused) return;
      setLogs(prev => {
        const newLogs = [...prev, entry];
        if (newLogs.length > maxLogs) return newLogs.slice(-maxLogs);
        return newLogs;
      });
    };

    on('logs:update', handleLog);
    return () => off('logs:update', handleLog);
  }, [connected, on, off, paused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !paused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel && log.level !== filterLevel) return false;
    if (filterSession && log.sessionId !== filterSession) return false;
    return true;
  });

  // Get unique sessions from logs
  const sessionsInLogs = Array.from(new Set(logs.filter(l => l.sessionId).map(l => l.sessionId!)));

  return (
    <div className="space-y-3 animate-fade-in h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[#d6dbe4]">Logs</h1>
          <p className="text-xs text-[#8b93a7] font-mono mt-0.5">
            {filteredLogs.length} entries {paused && '(paused)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <select
            className="input-field text-xs py-1.5"
            value={filterLevel || ''}
            onChange={(e) => setFilterLevel(e.target.value || null)}
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>

          {sessionsInLogs.length > 0 && (
            <select
              className="input-field text-xs py-1.5"
              value={filterSession || ''}
              onChange={(e) => setFilterSession(e.target.value || null)}
            >
              <option value="">All Sessions</option>
              {sessionsInLogs.map(sid => (
                <option key={sid} value={sid}>{sid.slice(0, 20)}...</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setPaused(!paused)}
            className={`btn-secondary p-2 ${paused ? 'text-[#e5a044]' : ''}`}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={clearLogs}
            className="btn-danger p-2"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div
        ref={scrollRef}
        className="panel flex-1 overflow-y-auto min-h-0"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <ScrollText className="w-8 h-8 text-[#262c36] mb-2" />
            <p className="text-sm text-[#8b93a7]">No logs yet</p>
            <p className="text-xs text-[#8b93a7] mt-1">Logs will appear here when sessions run</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262c36]/50">
            {filteredLogs.map((log, index) => {
              const Icon = LEVEL_ICONS[log.level];
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 px-3 py-1.5 font-mono text-xs ${LEVEL_BG[log.level]} hover:bg-[#1a1f2a]/50`}
                >
                  <span className="text-[#8b93a7] flex-shrink-0 mt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <Icon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${LEVEL_COLORS[log.level]}`} />
                  {log.sessionId && (
                    <span className="text-[#8b93a7] flex-shrink-0 bg-[#262c36] px-1 rounded">
                      {log.sessionId.slice(0, 12)}...
                    </span>
                  )}
                  <span className={`break-all whitespace-pre-wrap ${LEVEL_COLORS[log.level]}`}>
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

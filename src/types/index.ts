export interface Session {
  id: string;
  name: string;
  command: string;
  cwd: string;
  env: Record<string, string>;
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid: number | null;
  createdAt: number;
  startedAt: number | null;
  stoppedAt: number | null;
  restartCount: number;
  autoRestart: boolean;
  maxRestarts: number;
}

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    rx: number;
    tx: number;
    rxSec: number;
    txSec: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    hostname: string;
    uptime: number;
  };
  temperature: number | null;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
  created: number;
  mimeType?: string;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  sessionId?: string;
}

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface SessionCreateData {
  name: string;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  autoRestart?: boolean;
  maxRestarts?: number;
}

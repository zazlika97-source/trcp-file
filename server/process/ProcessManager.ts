import { spawn, ChildProcess } from 'child_process';
import { Session, ProcessInfo } from '../core/types';
import { eventBus } from '../events/EventBus';
import { logger } from '../utils/Logger';
import fs from 'fs';
import path from 'path';

interface TrackedProcess {
  process: ChildProcess;
  sessionId: string;
  startTime: number;
  stdout: string[];
  stderr: string[];
}

export class ProcessManager {
  private processes: Map<number, TrackedProcess> = new Map();
  private stats: Map<number, ProcessInfo> = new Map();
  private shell: string;

  constructor() {
    this.shell = this.findAvailableShell();
    logger.info(`ProcessManager using shell: ${this.shell}`);
    this.startStatsCollector();
  }

  private findAvailableShell(): string {
    // Daftar shell yang mungkin tersedia di Termux/Ubuntu proot
    const possibleShells = [
      '/usr/bin/bash',
      '/bin/bash',
      '/usr/bin/sh',
      '/bin/sh',
      '/data/data/com.termux/files/usr/bin/bash',
      '/data/data/com.termux/files/usr/bin/sh',
      process.env.SHELL,
    ].filter(Boolean);

    for (const shell of possibleShells) {
      if (shell && fs.existsSync(shell)) {
        logger.info(`Found shell: ${shell}`);
        return shell;
      }
    }

    // Fallback: coba cari di PATH
    logger.warn('No shell found in common paths, trying "bash" from PATH');
    return 'bash';
  }

  async spawn(session: Session): Promise<ChildProcess | null> {
    try {
      // Pastikan working directory ada
      let cwd = session.cwd;
      if (!fs.existsSync(cwd)) {
        logger.warn(`CWD does not exist: ${cwd}, falling back to home`);
        cwd = process.env.HOME || '/root';
        if (!fs.existsSync(cwd)) {
          cwd = '/';
        }
      }

      // Pastikan shell ada
      const shell = this.findAvailableShell();
      
      logger.info(`Spawning process for session: ${session.name}`);
      logger.info(`Shell: ${shell}`);
      logger.info(`Command: ${session.command}`);
      logger.info(`CWD: ${cwd}`);

      // Environment variables
      const env = { 
        ...process.env, 
        ...session.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      };

      // Spawn dengan shell yang benar
      const childProcess = spawn(shell, ['-c', session.command], {
        cwd,
        env,
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!childProcess.pid) {
        logger.error(`Failed to spawn process for session: ${session.name}`);
        return null;
      }

      const tracked: TrackedProcess = {
        process: childProcess,
        sessionId: session.id,
        startTime: Date.now(),
        stdout: [],
        stderr: [],
      };

      this.processes.set(childProcess.pid, tracked);

      // Setup log directory
      const logDir = path.join(cwd, 'logs');
      if (!fs.existsSync(logDir)) {
        try {
          fs.mkdirSync(logDir, { recursive: true });
        } catch (err) {
          logger.warn(`Failed to create log dir: ${err}`);
        }
      }
      
      let logStream: fs.WriteStream | null = null;
      try {
        const logFile = path.join(logDir, 'output.log');
        logStream = fs.createWriteStream(logFile, { flags: 'a' });
      } catch (err) {
        logger.warn(`Failed to create log stream: ${err}`);
      }

      childProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        tracked.stdout.push(output);
        if (tracked.stdout.length > 1000) tracked.stdout.shift();
        
        if (logStream) {
          logStream.write(`[OUT] ${output}`);
        }
        
        eventBus.emit('logs:update', {
          sessionId: session.id,
          level: 'info',
          message: output,
          timestamp: Date.now(),
        });
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        tracked.stderr.push(output);
        if (tracked.stderr.length > 1000) tracked.stderr.shift();
        
        if (logStream) {
          logStream.write(`[ERR] ${output}`);
        }
        
        eventBus.emit('logs:update', {
          sessionId: session.id,
          level: 'error',
          message: output,
          timestamp: Date.now(),
        });
      });

      childProcess.on('exit', (code, signal) => {
        logger.info(`Process exited for session ${session.name}: code=${code}, signal=${signal}`);
        if (logStream) {
          logStream.end();
        }
        this.processes.delete(childProcess.pid!);
        this.stats.delete(childProcess.pid!);
        eventBus.emit('process:exit', {
          sessionId: session.id,
          pid: childProcess.pid,
          code,
          signal,
        });
      });

      childProcess.on('error', (err) => {
        logger.error(`Process error for session ${session.name}:`, err);
        if (logStream) {
          logStream.end();
        }
        this.processes.delete(childProcess.pid!);
        this.stats.delete(childProcess.pid!);
        eventBus.emit('process:exit', {
          sessionId: session.id,
          pid: childProcess.pid,
          code: -1,
          signal: null,
          error: err.message,
        });
      });

      logger.info(`Spawned process: ${session.command} (PID: ${childProcess.pid}, Shell: ${shell})`);
      return childProcess;
    } catch (err) {
      logger.error(`Failed to spawn process for session ${session.name}:`, err);
      return null;
    }
  }

  kill(pid: number, signal: string = 'SIGTERM'): boolean {
    const tracked = this.processes.get(pid);
    if (!tracked) return false;

    try {
      tracked.process.kill(signal as NodeJS.Signals);
      logger.info(`Killed process ${pid} with signal ${signal}`);
      return true;
    } catch (err) {
      logger.error(`Failed to kill process ${pid}:`, err);
      return false;
    }
  }

  killBySession(sessionId: string, signal: string = 'SIGTERM'): boolean {
    for (const [pid, tracked] of this.processes) {
      if (tracked.sessionId === sessionId) {
        return this.kill(pid, signal);
      }
    }
    return false;
  }

  getProcessInfo(pid: number): ProcessInfo | null {
    const tracked = this.processes.get(pid);
    if (!tracked) return null;

    const uptime = Date.now() - tracked.startTime;
    return {
      pid,
      status: tracked.process.killed ? 'stopped' : 'running',
      cpu: 0,
      ram: 0,
      uptime,
      cwd: tracked.process.spawnargs.join(' '),
      command: tracked.process.spawnargs.join(' '),
      restartCount: 0,
    };
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.keys())
      .map(pid => this.getProcessInfo(pid))
      .filter((info): info is ProcessInfo => info !== null);
  }

  getRecentLogs(pid: number, maxLines: number = 100): { stdout: string; stderr: string } {
    const tracked = this.processes.get(pid);
    if (!tracked) return { stdout: '', stderr: '' };
    return {
      stdout: tracked.stdout.slice(-maxLines).join(''),
      stderr: tracked.stderr.slice(-maxLines).join(''),
    };
  }

  getProcessBySession(sessionId: string): ChildProcess | null {
    for (const tracked of this.processes.values()) {
      if (tracked.sessionId === sessionId) {
        return tracked.process;
      }
    }
    return null;
  }

  isSessionRunning(sessionId: string): boolean {
    const process = this.getProcessBySession(sessionId);
    return process !== null && !process.killed && process.exitCode === null;
  }

  private startStatsCollector() {
    setInterval(() => {
      for (const [pid, tracked] of this.processes) {
        if (tracked.process.killed) continue;
        // CPU/RAM stats would require systeminformation per PID
        // For now, emit basic stats
        eventBus.emit('process:update', {
          sessionId: tracked.sessionId,
          pid,
          uptime: Date.now() - tracked.startTime,
        });
      }
    }, 5000);
  }
}
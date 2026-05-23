import { spawn, IPty } from 'node-pty';
import { TerminalSize } from '../core/types';
import { eventBus } from '../events/EventBus';
import { logger } from '../utils/Logger';
import fs from 'fs';

interface TerminalSession {
  pty: IPty;
  sessionId: string;
  socketId: string;
  createdAt: number;
}

export class TerminalManager {
  private terminals: Map<string, TerminalSession> = new Map();
  private shell: string;

  constructor() {
    // Cari shell yang tersedia di sistem
    this.shell = this.findAvailableShell();
    logger.info(`Using shell: ${this.shell}`);
  }

  private findAvailableShell(): string {
    // Daftar shell yang mungkin tersedia
    const possibleShells = [
      '/bin/bash',
      '/usr/bin/bash',
      '/bin/sh',
      '/usr/bin/sh',
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

    // Fallback ke 'bash' (akan dicari di PATH)
    logger.warn('No shell found, using default: bash');
    return 'bash';
  }

  createTerminal(sessionId: string, socketId: string, size: TerminalSize, cwd?: string): string {
    const terminalId = `term_${sessionId}_${Date.now()}`;

    // Tentukan working directory
    let workingDir = cwd || process.cwd();
    
    // Pastikan working directory ada
    if (!fs.existsSync(workingDir)) {
      logger.warn(`Working directory does not exist: ${workingDir}, falling back to home`);
      workingDir = process.env.HOME || '/root';
      
      if (!fs.existsSync(workingDir)) {
        workingDir = '/';
      }
    }

    logger.info(`Creating terminal for session: ${sessionId}`);
    logger.info(`Shell: ${this.shell}`);
    logger.info(`Working directory: ${workingDir}`);
    logger.info(`Terminal size: ${size.cols}x${size.rows}`);

    try {
      // Spawn shell dengan node-pty
      const pty = spawn(this.shell, [], {
        name: 'xterm-256color',
        cols: size.cols || 80,
        rows: size.rows || 24,
        cwd: workingDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          SHELL: this.shell,
          HOME: process.env.HOME || '/root',
          USER: process.env.USER || 'root',
        } as { [key: string]: string },
      });

      const session: TerminalSession = {
        pty,
        sessionId,
        socketId,
        createdAt: Date.now(),
      };

      this.terminals.set(terminalId, session);

      pty.onData((data: string) => {
        eventBus.emit('terminal:data', {
          terminalId,
          sessionId,
          data,
        });
      });

      pty.onExit(({ exitCode, signal }) => {
        logger.info(`Terminal exited: ${terminalId} (code: ${exitCode}, signal: ${signal})`);
        this.terminals.delete(terminalId);
        eventBus.emit('terminal:exit', {
          terminalId,
          sessionId,
          exitCode,
          signal,
        });
      });

      logger.info(`Terminal created successfully: ${terminalId}`);
      return terminalId;
    } catch (err) {
      logger.error(`Failed to create terminal:`, err);
      throw err;
    }
  }

  write(terminalId: string, data: string): boolean {
    const session = this.terminals.get(terminalId);
    if (!session) {
      logger.warn(`Terminal not found: ${terminalId}`);
      return false;
    }

    try {
      session.pty.write(data);
      return true;
    } catch (err) {
      logger.error(`Failed to write to terminal ${terminalId}:`, err);
      return false;
    }
  }

  resize(terminalId: string, size: TerminalSize): boolean {
    const session = this.terminals.get(terminalId);
    if (!session) return false;

    try {
      session.pty.resize(size.cols, size.rows);
      return true;
    } catch (err) {
      logger.error(`Failed to resize terminal ${terminalId}:`, err);
      return false;
    }
  }

  kill(terminalId: string): boolean {
    const session = this.terminals.get(terminalId);
    if (!session) return false;

    try {
      session.pty.kill();
      this.terminals.delete(terminalId);
      logger.info(`Killed terminal: ${terminalId}`);
      return true;
    } catch (err) {
      logger.error(`Failed to kill terminal ${terminalId}:`, err);
      return false;
    }
  }

  killBySession(sessionId: string): number {
    let count = 0;
    for (const [id, session] of this.terminals) {
      if (session.sessionId === sessionId) {
        this.kill(id);
        count++;
      }
    }
    return count;
  }

  getTerminal(terminalId: string): TerminalSession | undefined {
    return this.terminals.get(terminalId);
  }

  getAllTerminals(): Array<{ terminalId: string; sessionId: string; socketId: string; createdAt: number }> {
    return Array.from(this.terminals.entries()).map(([id, session]) => ({
      terminalId: id,
      sessionId: session.sessionId,
      socketId: session.socketId,
      createdAt: session.createdAt,
    }));
  }

  getTerminalsBySession(sessionId: string): string[] {
    return Array.from(this.terminals.entries())
      .filter(([, session]) => session.sessionId === sessionId)
      .map(([id]) => id);
  }
}
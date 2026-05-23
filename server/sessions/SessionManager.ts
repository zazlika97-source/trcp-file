import { Session, SessionCreateData } from '../core/types';
import { eventBus } from '../events/EventBus';
import { logger } from '../utils/Logger';
import { WorkspaceManager } from '../workspace/WorkspaceManager';
import { ProcessManager } from '../process/ProcessManager';
import fs from 'fs';
import path from 'path';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private workspaceManager: WorkspaceManager;
  private processManager: ProcessManager;
  private configPath: string;

  constructor(workspaceManager: WorkspaceManager, processManager: ProcessManager) {
    this.workspaceManager = workspaceManager;
    this.processManager = processManager;
    this.configPath = path.join(process.cwd(), 'data', 'sessions.json');
    this.loadSessions();
  }

  private loadSessions() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        for (const session of data) {
          this.sessions.set(session.id, { ...session, status: 'stopped', pid: null });
        }
        logger.info(`Loaded ${this.sessions.size} sessions from config`);
      }
    } catch (err) {
      logger.error('Failed to load sessions:', err);
    }
  }

  private saveSessions() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = Array.from(this.sessions.values());
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    } catch (err) {
      logger.error('Failed to save sessions:', err);
    }
  }

  create(data: SessionCreateData): Session {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const workspacePath = this.workspaceManager.createWorkspace(id);

    const session: Session = {
      id,
      name: data.name,
      command: data.command,
      cwd: data.cwd || workspacePath,
      env: data.env || {},
      status: 'stopped',
      pid: null,
      createdAt: Date.now(),
      startedAt: null,
      stoppedAt: null,
      restartCount: 0,
      autoRestart: data.autoRestart ?? false,
      maxRestarts: data.maxRestarts ?? 5,
    };

    this.sessions.set(id, session);
    this.saveSessions();

    logger.info(`Created session: ${session.name} (${id})`);
    eventBus.emit('session:create', session);
    return session;
  }

  async start(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return null;
    }

    if (session.status === 'running') {
      logger.warn(`Session already running: ${session.name}`);
      return session;
    }

    try {
      session.status = 'starting';
      eventBus.emit('session:update', session);

      const process = await this.processManager.spawn(session);
      if (process) {
        session.pid = process.pid;
        session.status = 'running';
        session.startedAt = Date.now();
        session.stoppedAt = null;
        eventBus.emit('session:update', session);
        eventBus.emit('process:start', { sessionId: session.id, pid: process.pid });
        logger.info(`Started session: ${session.name} (PID: ${process.pid})`);
      } else {
        session.status = 'error';
        eventBus.emit('session:update', session);
        logger.error(`Failed to start session: ${session.name}`);
      }

      this.saveSessions();
      return session;
    } catch (err) {
      session.status = 'error';
      eventBus.emit('session:update', session);
      logger.error(`Error starting session ${session.name}:`, err);
      this.saveSessions();
      return session;
    }
  }

  stop(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.pid) {
      this.processManager.kill(session.pid);
      session.pid = null;
    }

    session.status = 'stopped';
    session.stoppedAt = Date.now();
    this.saveSessions();

    eventBus.emit('session:update', session);
    logger.info(`Stopped session: ${session.name}`);
    return session;
  }

  async restart(sessionId: string): Promise<Session | null> {
    this.stop(sessionId);
    await new Promise(resolve => setTimeout(resolve, 500));
    const session = await this.start(sessionId);
    if (session) {
      session.restartCount++;
      this.saveSessions();
    }
    return session;
  }

  kill(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.pid) {
      this.processManager.kill(session.pid, 'SIGKILL');
      session.pid = null;
    }

    session.status = 'stopped';
    session.stoppedAt = Date.now();
    this.saveSessions();

    eventBus.emit('session:update', session);
    logger.info(`Killed session: ${session.name}`);
    return session;
  }

  delete(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.status === 'running') {
      this.stop(sessionId);
    }

    this.sessions.delete(sessionId);
    this.workspaceManager.deleteWorkspace(sessionId);
    this.saveSessions();

    eventBus.emit('session:delete', { sessionId });
    logger.info(`Deleted session: ${session.name}`);
    return true;
  }

  duplicate(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return this.create({
      name: `${session.name} (copy)`,
      command: session.command,
      cwd: session.cwd,
      env: { ...session.env },
      autoRestart: session.autoRestart,
      maxRestarts: session.maxRestarts,
    });
  }
  
  update(sessionId: string, data: Partial<SessionCreateData>): Session | null {
  const session = this.sessions.get(sessionId);
  if (!session) return null;

  // Update hanya field yang diizinkan
  if (data.name !== undefined) session.name = data.name;
  if (data.command !== undefined) session.command = data.command;
  if (data.cwd !== undefined) session.cwd = data.cwd;
  if (data.env !== undefined) session.env = { ...session.env, ...data.env };
  if (data.autoRestart !== undefined) session.autoRestart = data.autoRestart;
  if (data.maxRestarts !== undefined) session.maxRestarts = data.maxRestarts;

  this.saveSessions();
  eventBus.emit('session:update', session);
  logger.info(`Session updated: ${session.name} (${sessionId})`);
  
  return session;
}

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  getRunning(): Session[] {
    return this.getAll().filter(s => s.status === 'running');
  }

  handleProcessExit(sessionId: string, code: number | null, signal: string | null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.pid = null;
    session.stoppedAt = Date.now();

    if (session.autoRestart && session.restartCount < session.maxRestarts) {
      logger.info(`Auto-restarting session: ${session.name} (exit code: ${code}, restarts: ${session.restartCount + 1})`);
      setTimeout(() => this.restart(sessionId), 1000);
    } else {
      session.status = code === 0 ? 'stopped' : 'error';
      logger.info(`Session exited: ${session.name} (code: ${code}, signal: ${signal})`);
    }

    this.saveSessions();
    eventBus.emit('session:update', session);
    eventBus.emit('process:exit', { sessionId, code, signal });
  }
}

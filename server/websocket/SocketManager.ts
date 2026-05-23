import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SessionManager } from '../sessions/SessionManager';
import { TerminalManager } from '../terminal/TerminalManager';
import { FileManager } from '../filesystem/FileManager';
import { StatsCollector } from '../stats/StatsCollector';
import { eventBus } from '../events/EventBus';
import { logger } from '../utils/Logger';
import { TerminalSize } from '../core/types';

export class SocketManager {
  private io: SocketIOServer;
  private sessionManager: SessionManager;
  private terminalManager: TerminalManager;
  private fileManager: FileManager;
  private statsCollector: StatsCollector;

  constructor(
    httpServer: HttpServer,
    sessionManager: SessionManager,
    terminalManager: TerminalManager,
    fileManager: FileManager,
    statsCollector: StatsCollector
  ) {
    this.sessionManager = sessionManager;
    this.terminalManager = terminalManager;
    this.fileManager = fileManager;
    this.statsCollector = statsCollector;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.setupEventBusForwarding();
    this.setupConnectionHandler();
    
    logger.info('Socket.IO initialized');
  }

  private setupEventBusForwarding() {
    // Forward all realtime events to connected clients
    eventBus.on('terminal:data', ({ terminalId, sessionId, data }) => {
      this.io.to(`session:${sessionId}`).emit('terminal:data', { terminalId, data });
    });

    eventBus.on('terminal:exit', ({ terminalId, sessionId, exitCode }) => {
      this.io.to(`session:${sessionId}`).emit('terminal:exit', { terminalId, exitCode });
    });

    eventBus.on('logs:update', (logEntry) => {
      this.io.to(`session:${logEntry.sessionId}`).emit('logs:update', logEntry);
      this.io.emit('logs:update', logEntry);
    });

    eventBus.on('stats:update', (stats) => {
      this.io.emit('stats:update', stats);
    });

    eventBus.on('process:update', (update) => {
      this.io.to(`session:${update.sessionId}`).emit('process:update', update);
    });

    eventBus.on('process:exit', ({ sessionId, code, signal }) => {
      this.io.to(`session:${sessionId}`).emit('process:exit', { sessionId, code, signal });
      this.io.emit('session:update', this.sessionManager.get(sessionId));
    });

    eventBus.on('session:update', (session) => {
      this.io.emit('session:update', session);
    });

    eventBus.on('session:create', (session) => {
      this.io.emit('session:create', session);
    });

    eventBus.on('session:delete', ({ sessionId }) => {
      this.io.emit('session:delete', { sessionId });
    });
  }

  private setupConnectionHandler() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join session room
      socket.on('session:join', (sessionId: string) => {
        socket.join(`session:${sessionId}`);
        logger.debug(`Socket ${socket.id} joined session: ${sessionId}`);
      });

      socket.on('session:leave', (sessionId: string) => {
        socket.leave(`session:${sessionId}`);
        logger.debug(`Socket ${socket.id} left session: ${sessionId}`);
      });

      // Session events
      socket.on('session:list', async (callback) => {
        logger.info('session:list called');
        try {
          const sessions = this.sessionManager.getAll();
          logger.info(`Returning ${sessions.length} sessions`);
          if (callback && typeof callback === 'function') {
            callback({ sessions });
          } else {
            socket.emit('session:list', { sessions });
          }
        } catch (err: any) {
          logger.error(`Error in session:list: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ error: err.message, sessions: [] });
          }
        }
      });

      socket.on('session:create', async (data, callback) => {
        logger.info(`session:create called for: ${data?.name}`);
        try {
          const session = this.sessionManager.create(data);
          logger.info(`Session created: ${session.id}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:create', session);
        } catch (err: any) {
          logger.error(`Error in session:create: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:start', async (sessionId: string, callback) => {
        logger.info(`session:start called for: ${sessionId}`);
        try {
          const session = await this.sessionManager.start(sessionId);
          logger.info(`Session started: ${sessionId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:update', session);
        } catch (err: any) {
          logger.error(`Error in session:start: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:stop', (sessionId: string, callback) => {
        logger.info(`session:stop called for: ${sessionId}`);
        try {
          const session = this.sessionManager.stop(sessionId);
          logger.info(`Session stopped: ${sessionId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:update', session);
        } catch (err: any) {
          logger.error(`Error in session:stop: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:restart', async (sessionId: string, callback) => {
        logger.info(`session:restart called for: ${sessionId}`);
        try {
          const session = await this.sessionManager.restart(sessionId);
          logger.info(`Session restarted: ${sessionId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:update', session);
        } catch (err: any) {
          logger.error(`Error in session:restart: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:kill', (sessionId: string, callback) => {
        logger.info(`session:kill called for: ${sessionId}`);
        try {
          const session = this.sessionManager.kill(sessionId);
          logger.info(`Session killed: ${sessionId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:update', session);
        } catch (err: any) {
          logger.error(`Error in session:kill: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:delete', (sessionId: string, callback) => {
        logger.info(`session:delete called for: ${sessionId}`);
        try {
          const result = this.sessionManager.delete(sessionId);
          logger.info(`Session deleted: ${sessionId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: result });
          }
          this.io.emit('session:delete', { sessionId });
        } catch (err: any) {
          logger.error(`Error in session:delete: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('session:duplicate', (sessionId: string, callback) => {
        logger.info(`session:duplicate called for: ${sessionId}`);
        try {
          const session = this.sessionManager.duplicate(sessionId);
          logger.info(`Session duplicated: ${session.id}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, session });
          }
          this.io.emit('session:create', session);
        } catch (err: any) {
          logger.error(`Error in session:duplicate: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      // Terminal events
      socket.on('terminal:create', ({ sessionId, size, cwd }, callback) => {
        logger.info(`terminal:create called for session: ${sessionId}`);
        try {
          const terminalId = this.terminalManager.createTerminal(
            sessionId,
            socket.id,
            size as TerminalSize,
            cwd
          );
          socket.join(`session:${sessionId}`);
          logger.info(`Terminal created: ${terminalId}`);
          if (callback && typeof callback === 'function') {
            callback({ success: true, terminalId });
          }
        } catch (err: any) {
          logger.error(`Error in terminal:create: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('terminal:write', ({ terminalId, data }) => {
        this.terminalManager.write(terminalId, data);
      });

      socket.on('terminal:resize', ({ terminalId, size }) => {
        this.terminalManager.resize(terminalId, size as TerminalSize);
      });

      socket.on('terminal:kill', ({ terminalId }, callback) => {
        logger.info(`terminal:kill called for: ${terminalId}`);
        try {
          const result = this.terminalManager.kill(terminalId);
          if (callback && typeof callback === 'function') {
            callback({ success: result });
          }
        } catch (err: any) {
          logger.error(`Error in terminal:kill: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      // File events
      socket.on('file:list', (dirPath: string, callback) => {
        logger.debug(`file:list called for: ${dirPath}`);
        try {
          const files = this.fileManager.list(dirPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true, files });
          }
        } catch (err: any) {
          logger.error(`Error in file:list: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:read', (filePath: string, callback) => {
        logger.debug(`file:read called for: ${filePath}`);
        try {
          const result = this.fileManager.readFile(filePath);
          if (callback && typeof callback === 'function') {
            callback({ success: true, ...result });
          }
        } catch (err: any) {
          logger.error(`Error in file:read: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:write', ({ filePath, content }, callback) => {
        logger.debug(`file:write called for: ${filePath}`);
        try {
          this.fileManager.writeFile(filePath, content);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:write: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:mkdir', (dirPath: string, callback) => {
        logger.debug(`file:mkdir called for: ${dirPath}`);
        try {
          this.fileManager.createDirectory(dirPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:mkdir: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:rename', ({ oldPath, newPath }, callback) => {
        logger.debug(`file:rename called: ${oldPath} -> ${newPath}`);
        try {
          this.fileManager.rename(oldPath, newPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:rename: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:delete', (itemPath: string, callback) => {
        logger.debug(`file:delete called for: ${itemPath}`);
        try {
          this.fileManager.delete(itemPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:delete: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:compress', ({ sourcePath, zipPath }, callback) => {
        logger.debug(`file:compress called: ${sourcePath} -> ${zipPath}`);
        try {
          this.fileManager.compressToZip(sourcePath, zipPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:compress: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('file:extract', ({ zipPath, destPath }, callback) => {
        logger.debug(`file:extract called: ${zipPath} -> ${destPath}`);
        try {
          this.fileManager.extractZip(zipPath, destPath);
          if (callback && typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.error(`Error in file:extract: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      // Stats
      socket.on('stats:get', async (callback) => {
        logger.debug('stats:get called');
        try {
          const stats = await this.statsCollector.getCurrentStats();
          if (callback && typeof callback === 'function') {
            callback({ success: true, stats });
          }
        } catch (err: any) {
          logger.error(`Error in stats:get: ${err.message}`);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
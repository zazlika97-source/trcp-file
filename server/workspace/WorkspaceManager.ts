import fs from 'fs';
import path from 'path';
import { logger } from '../utils/Logger';
import { WorkspaceInfo } from '../core/types';

export class WorkspaceManager {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || path.join(process.cwd(), 'workspaces');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  createWorkspace(sessionId: string): string {
    const workspacePath = path.join(this.basePath, sessionId);
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
      fs.mkdirSync(path.join(workspacePath, 'logs'), { recursive: true });
      fs.writeFileSync(path.join(workspacePath, '.env'), '');
      fs.writeFileSync(
        path.join(workspacePath, 'config.json'),
        JSON.stringify({ createdAt: Date.now(), sessionId }, null, 2)
      );
      logger.info(`Created workspace: ${workspacePath}`);
    }
    return workspacePath;
  }

  getWorkspace(sessionId: string): string {
    return path.join(this.basePath, sessionId);
  }

  deleteWorkspace(sessionId: string): boolean {
    const workspacePath = path.join(this.basePath, sessionId);
    if (fs.existsSync(workspacePath)) {
      fs.rmSync(workspacePath, { recursive: true, force: true });
      logger.info(`Deleted workspace: ${workspacePath}`);
      return true;
    }
    return false;
  }

  workspaceExists(sessionId: string): boolean {
    return fs.existsSync(path.join(this.basePath, sessionId));
  }

  getWorkspaceInfo(sessionId: string): WorkspaceInfo | null {
    const workspacePath = path.join(this.basePath, sessionId);
    if (!fs.existsSync(workspacePath)) return null;

    const stats = fs.statSync(workspacePath);
    const size = this.getDirectorySize(workspacePath);

    return {
      name: sessionId,
      path: workspacePath,
      sessionCount: 1,
      size,
      createdAt: stats.birthtimeMs,
    };
  }

  getAllWorkspaces(): WorkspaceInfo[] {
    if (!fs.existsSync(this.basePath)) return [];
    const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => this.getWorkspaceInfo(entry.name))
      .filter((info): info is WorkspaceInfo => info !== null);
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          totalSize += this.getDirectorySize(fullPath);
        } else {
          totalSize += fs.statSync(fullPath).size;
        }
      }
    } catch {
      // skip
    }
    return totalSize;
  }

  readEnv(sessionId: string): Record<string, string> {
    const envPath = path.join(this.basePath, sessionId, '.env');
    const env: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    return env;
  }

  writeEnv(sessionId: string, env: Record<string, string>): void {
    const envPath = path.join(this.basePath, sessionId, '.env');
    const content = Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    fs.writeFileSync(envPath, content);
  }

  readConfig(sessionId: string): Record<string, any> | null {
    const configPath = path.join(this.basePath, sessionId, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        return null;
      }
    }
    return null;
  }

  writeConfig(sessionId: string, config: Record<string, any>): void {
    const configPath = path.join(this.basePath, sessionId, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

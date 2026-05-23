import { logger } from '../utils/Logger';
import os from 'os';
import fs from 'fs';

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
    uptime: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: Array<{
    mount: string;
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  }>;
  network: Array<{
    interface: string;
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  }>;
  os: {
    platform: string;
    distro: string;
    release: string;
    hostname: string;
    arch: string;
    kernel: string;
    uptime: number;
  };
  processes: {
    total: number;
    running: number;
  };
  timestamp: number;
}

export class StatsCollector {
  private interval: NodeJS.Timeout | null = null;
  private currentStats: SystemStats | null = null;
  private statsHistory: SystemStats[] = [];
  private maxHistorySize: number = 60;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    logger.info('StatsCollector initialized with OS tracking');
  }

  private async getOSInfo() {
    const platform = os.platform();
    const release = os.release();
    const hostname = os.hostname();
    const arch = os.arch();
    const kernel = os.version();
    
    let distro = platform;
    
    // Deteksi distro Linux
    if (platform === 'linux') {
      try {
        // Coba baca dari /etc/os-release
        if (fs.existsSync('/etc/os-release')) {
          const content = fs.readFileSync('/etc/os-release', 'utf8');
          const match = content.match(/PRETTY_NAME="([^"]+)"/);
          if (match) {
            distro = match[1];
          }
        }
      } catch (err) {
        // Fallback
      }
      
      // Deteksi Termux
      if (fs.existsSync('/data/data/com.termux')) {
        distro = 'Termux';
      }
    } else if (platform === 'android') {
      distro = 'Android';
    } else if (platform === 'darwin') {
      distro = 'macOS';
    } else if (platform === 'win32') {
      distro = 'Windows';
    }
    
    return {
      platform,
      distro,
      release,
      hostname,
      arch,
      kernel,
      uptime: os.uptime(),
    };
  }

  async collectStats(): Promise<SystemStats> {
    // Hitung uptime manual
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Dapatkan info OS
    const osInfo = await this.getOSInfo();
    
    // Memory stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU stats
    const cpuCores = os.cpus().length;
    const cpuSpeed = os.cpus()[0]?.speed || 0;
    const cpuUsage = Math.min(100, Math.max(0, os.loadavg()[0] * 10));
    
    // Disk stats
    let disks: Array<any> = [];
    try {
      const { execSync } = await import('child_process');
      const dfOutput = execSync('df -B1').toString();
      const lines = dfOutput.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/\s+/);
        if (parts.length >= 6 && parts[0] !== 'tmpfs' && parts[0] !== 'devtmpfs') {
          disks.push({
            mount: parts[5],
            total: parseInt(parts[1]),
            used: parseInt(parts[2]),
            free: parseInt(parts[3]),
            usagePercent: parseFloat(parts[4]),
          });
        }
      }
    } catch (err) {
      // Fallback
      disks = [{
        mount: '/',
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: (usedMem / totalMem) * 100,
      }];
    }

    const stats: SystemStats = {
      cpu: {
        usage: cpuUsage,
        cores: cpuCores,
        speed: cpuSpeed,
        uptime: uptimeSeconds,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: (usedMem / totalMem) * 100,
      },
      disk: disks,
      network: [],
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        hostname: osInfo.hostname,
        arch: osInfo.arch,
        kernel: osInfo.kernel,
        uptime: osInfo.uptime,
      },
      processes: {
        total: 0,
        running: 0,
      },
      timestamp: Date.now(),
    };

    this.currentStats = stats;
    this.addToHistory(stats);
    
    const uptimeFormatted = this.formatUptime(uptimeSeconds);
    logger.debug(`Stats: ${osInfo.distro} | Uptime ${uptimeFormatted} | CPU ${cpuUsage.toFixed(1)}% | MEM ${(stats.memory.usagePercent).toFixed(1)}%`);
    
    return stats;
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  private addToHistory(stats: SystemStats) {
    this.statsHistory.push(stats);
    if (this.statsHistory.length > this.maxHistorySize) {
      this.statsHistory.shift();
    }
  }

  async getCurrentStats(): Promise<SystemStats> {
    if (!this.currentStats) {
      return await this.collectStats();
    }
    return this.currentStats;
  }

  async getStatsHistory(duration: number = 60000): Promise<SystemStats[]> {
    const cutoff = Date.now() - duration;
    return this.statsHistory.filter(stat => stat.timestamp >= cutoff);
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getFormattedUptime(): string {
    return this.formatUptime(this.getUptime());
  }

  startCollecting(intervalMs: number = 1000) {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.collectStats();
    this.interval = setInterval(() => {
      this.collectStats();
    }, intervalMs);

    logger.info(`Stats collection started (interval: ${intervalMs}ms)`);
  }

  stopCollecting() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Stats collection stopped');
    }
  }
}
// src/hooks/useStats.ts
import { useState, useEffect } from 'react';

interface Stats {
  cpu: { usage: number; cores: number[]; speed: number; uptime: number; loadAverage: number[] };
  memory: { total: number; used: number; free: number; usage: number };
  storage: { total: number; used: number; free: number; usage: number };
  network: { rx: number; tx: number; rxSec: number; txSec: number };
  os: { hostname: string; platform: string; distro: string; release: string; uptime: number };
  temperature: number | null;
}

export function useStats(): Stats {
  const [stats, setStats] = useState<Stats>({
    cpu: { usage: 0, cores: [], speed: 0, uptime: 0, loadAverage: [0, 0, 0] },
    memory: { total: 0, used: 0, free: 0, usage: 0 },
    storage: { total: 0, used: 0, free: 0, usage: 0 },
    network: { rx: 0, tx: 0, rxSec: 0, txSec: 0 },
    os: { hostname: 'Termux', platform: 'Android', distro: 'Termux', release: '', uptime: 0 },
    temperature: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.success && data.stats) {
          const s = data.stats;
          
          setStats(prev => ({
            cpu: {
              usage: s.cpu?.usage || 0,
              cores: s.cpu?.cores || [],
              speed: s.cpu?.speed || 0,
              uptime: s.cpu?.uptime || prev.cpu.uptime,
              loadAverage: s.cpu?.loadAverage || [0, 0, 0],
            },
            memory: {
              total: s.memory?.total || 0,
              used: s.memory?.used || 0,
              free: s.memory?.free || 0,
              usage: Math.round(s.memory?.usagePercent || 0),
            },
            storage: {
              total: s.disk?.[0]?.total || 0,
              used: s.disk?.[0]?.used || 0,
              free: s.disk?.[0]?.free || 0,
              usage: Math.round(s.disk?.[0]?.usagePercent || 0),
            },
            network: prev.network,
            os: {
              hostname: s.os?.hostname || 'Termux',
              platform: s.os?.platform || 'Android',
              distro: s.os?.distro || 'Termux',
              release: s.os?.release || '',
              uptime: s.cpu?.uptime || prev.os.uptime,
            },
            temperature: null,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
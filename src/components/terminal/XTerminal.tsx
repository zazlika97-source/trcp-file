import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useSocket } from '@/hooks/useSocket';

interface XTerminalProps {
  terminalId: string;
  sessionId: string;
  onExit?: () => void;
  className?: string;
}

export function XTerminal({ terminalId, sessionId, onExit, className = '' }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { on, off, emit } = useSocket();

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      theme: {
        background: '#0f1115',
        foreground: '#d6dbe4',
        cursor: '#4fa3ff',
        selectionBackground: 'rgba(79, 163, 255, 0.2)',
        black: '#0f1115',
        red: '#ff6b6b',
        green: '#57c27e',
        yellow: '#e5a044',
        blue: '#4fa3ff',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#d6dbe4',
        brightBlack: '#3a414d',
        brightRed: '#ff8585',
        brightGreen: '#7ddda0',
        brightYellow: '#f0b85a',
        brightBlue: '#7ab8ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#67e8f9',
        brightWhite: '#e8ecf1',
      },
      scrollback: 5000,
      allowProposedApi: true,
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    term.open(containerRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          emit('terminal:resize', { terminalId, size: { cols: dims.cols, rows: dims.rows } });
        }
      } catch {
        term.resize(80, 24);
        emit('terminal:resize', { terminalId, size: { cols: 80, rows: 24 } });
      }
    }, 100);

    terminalRef.current = term;

    const disposable = term.onData((data) => {
      emit('terminal:write', { terminalId, data });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && terminalRef.current && fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
          const dims = fitAddonRef.current.proposeDimensions();
          if (dims) {
            emit('terminal:resize', { terminalId, size: { cols: dims.cols, rows: dims.rows } });
          }
        } catch {
          // ignore
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [terminalId, sessionId, emit]);

  // Listen for data from server
  useEffect(() => {
    const handleData = ({ terminalId: tid, data }: { terminalId: string; data: string }) => {
      if (tid === terminalId && terminalRef.current) {
        terminalRef.current.write(data);
      }
    };

    const handleExit = ({ terminalId: tid }: { terminalId: string; exitCode: number }) => {
      if (tid === terminalId) {
        if (terminalRef.current) {
          terminalRef.current.writeln('');
          terminalRef.current.writeln('\x1b[33m[TRCP] Terminal session ended\x1b[0m');
        }
        onExit?.();
      }
    };

    on('terminal:data', handleData);
    on('terminal:exit', handleExit);

    return () => {
      off('terminal:data', handleData);
      off('terminal:exit', handleExit);
    };
  }, [terminalId, on, off, onExit]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-[#0f1115] ${className}`}
      style={{ overflow: 'hidden' }}
    />
  );
}

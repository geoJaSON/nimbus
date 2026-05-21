import { useState } from 'react';
import { useAlertStore } from '../../store/alertStore';
import { alertColor, isWatch, isTornado } from '../../lib/alertParsing';
import { TerminalPanel } from '../shared/TerminalPanel';
import type { WeatherAlert } from '../../types';

interface AlertPanelProps {
  onClose: () => void;
}

export function AlertPanel({ onClose }: AlertPanelProps) {
  const alerts = useAlertStore((s) => s.alerts);
  const selectedAlertId = useAlertStore((s) => s.selectedAlertId);
  const selectAlert = useAlertStore((s) => s.selectAlert);
  const lastFetched = useAlertStore((s) => s.lastFetched);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;

  return (
    <TerminalPanel
      title={`ALERTS (${alerts.length})`}
      onClose={onClose}
      width="w-80"
    >
      {selectedAlert ? (
        <AlertDetail alert={selectedAlert} onBack={() => selectAlert(null)} />
      ) : (
        <AlertList alerts={alerts} onSelect={(id) => selectAlert(id)} lastFetched={lastFetched} />
      )}
    </TerminalPanel>
  );
}

// ── Alert list ──────────────────────────────────────────────────────────────

function AlertList({
  alerts,
  onSelect,
  lastFetched,
}: {
  alerts: WeatherAlert[];
  onSelect: (id: string) => void;
  lastFetched: Date | null;
}) {
  const [filter, setFilter] = useState<'all' | 'warning' | 'watch'>('all');

  const filtered = alerts.filter((a) => {
    if (filter === 'warning') return !isWatch(a.event);
    if (filter === 'watch') return isWatch(a.event);
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-terminal-border shrink-0">
        {(['all', 'warning', 'watch'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`retro-btn px-2 py-0.5 text-xs ${filter === f ? 'active' : ''}`}
          >
            {f.toUpperCase()}
          </button>
        ))}
        {lastFetched && (
          <span className="ml-auto text-xs text-terminal-border self-center tabular-nums">
            {lastFetched.toISOString().slice(11, 19)}Z
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-terminal-border">
          {alerts.length === 0 ? 'FETCHING...' : 'NO MATCHING ALERTS'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({
  alert,
  onSelect,
}: {
  alert: WeatherAlert;
  onSelect: (id: string) => void;
}) {
  const color = alertColor(alert.event);
  const tornado = isTornado(alert.event);
  const watch = isWatch(alert.event);

  const now = Date.now();
  const expiresInMin = Math.round((alert.expires.getTime() - now) / 60000);
  const expired = expiresInMin <= 0;

  return (
    <button
      onClick={() => onSelect(alert.id)}
      className="w-full text-left px-3 py-2 border-b border-terminal-border-dim hover:bg-phosphor-dark transition-colors"
    >
      {/* Event badge */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-bold shrink-0 ${tornado ? 'animate-blink' : ''}`}
          style={{ color }}
        >
          {watch ? '◇' : '◆'} {alert.event.toUpperCase()}
        </span>
        <span className={`text-xs tabular-nums shrink-0 ${expired ? 'text-terminal-border line-through' : 'text-phosphor-dim'}`}>
          {expired ? 'EXP' : `EXP ${expiresInMin}M`}
        </span>
      </div>

      {/* Headline */}
      <div className="text-xs text-phosphor-dim mt-0.5 line-clamp-2 leading-tight">
        {alert.headline || alert.wfo}
      </div>
    </button>
  );
}

// ── Alert detail ────────────────────────────────────────────────────────────

function AlertDetail({ alert, onBack }: { alert: WeatherAlert; onBack: () => void }) {
  const color = alertColor(alert.event);

  return (
    <div className="flex flex-col h-full">
      {/* Back + header */}
      <div className="px-3 py-2 border-b border-terminal-border shrink-0">
        <button
          onClick={onBack}
          className="text-xs text-phosphor-dim hover:text-phosphor mb-1"
        >
          ← BACK TO LIST
        </button>
        <div className="text-xs font-bold" style={{ color }}>
          {alert.event.toUpperCase()}
        </div>
        <div className="text-xs text-phosphor-dim">{alert.wfo}</div>
      </div>

      {/* Meta */}
      <div className="px-3 py-2 border-b border-terminal-border text-xs text-phosphor-dim shrink-0 space-y-0.5">
        <div>ISSUED: <span className="text-phosphor">{alert.issued.toISOString().slice(0, 16).replace('T', ' ')}Z</span></div>
        <div>EXPIRES: <span className="text-phosphor">{alert.expires.toISOString().slice(0, 16).replace('T', ' ')}Z</span></div>
        <div>SEVERITY: <span className="text-phosphor">{alert.severity.toUpperCase()}</span></div>
      </div>

      {/* Body text */}
      <div className="flex-1 overflow-y-auto px-3 py-2 text-xs text-phosphor-dim leading-relaxed space-y-3">
        {alert.headline && (
          <p className="text-phosphor">{alert.headline}</p>
        )}
        {alert.description && (
          <pre className="whitespace-pre-wrap font-mono text-xs">{alert.description}</pre>
        )}
        {alert.instruction && (
          <div>
            <div className="text-amber mb-1">PRECAUTIONARY/PREPAREDNESS ACTIONS</div>
            <pre className="whitespace-pre-wrap font-mono text-xs">{alert.instruction}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

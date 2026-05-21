import { useState } from 'react';
import { useSpcStore } from '../../store/spcStore';
import { LSR_COLORS } from '../../lib/lsrParsing';
import { TerminalPanel } from '../shared/TerminalPanel';
import type { LocalStormReport } from '../../types';

interface LSRPanelProps {
  onClose: () => void;
}

type LsrFilter = 'ALL' | LocalStormReport['type'];

const FILTERS: LsrFilter[] = ['ALL', 'TORNADO', 'HAIL', 'WIND', 'FLOOD', 'SNOW'];

export function LSRPanel({ onClose }: LSRPanelProps) {
  const lsrs = useSpcStore((s) => s.lsrs);
  const lsrFetchedAt = useSpcStore((s) => s.lsrFetchedAt);
  const selectedLsrId = useSpcStore((s) => s.selectedLsrId);
  const selectLsr = useSpcStore((s) => s.selectLsr);
  const [filter, setFilter] = useState<LsrFilter>('ALL');

  const selected = lsrs.find((l) => l.id === selectedLsrId) ?? null;

  return (
    <TerminalPanel title={`LSR (${lsrs.length})`} onClose={onClose} width="w-80">
      {selected ? (
        <LsrDetail lsr={selected} onBack={() => selectLsr(null)} />
      ) : (
        <LsrList
          lsrs={lsrs}
          filter={filter}
          onFilter={setFilter}
          onSelect={(l) => selectLsr(l.id)}
          fetchedAt={lsrFetchedAt}
        />
      )}
    </TerminalPanel>
  );
}

function LsrList({
  lsrs,
  filter,
  onFilter,
  onSelect,
  fetchedAt,
}: {
  lsrs: LocalStormReport[];
  filter: LsrFilter;
  onFilter: (f: LsrFilter) => void;
  onSelect: (l: LocalStormReport) => void;
  fetchedAt: Date | null;
}) {
  const filtered = filter === 'ALL' ? lsrs : lsrs.filter((l) => l.type === filter);
  const sorted = [...filtered].sort((a, b) => b.time.getTime() - a.time.getTime());

  const emptyMessage =
    fetchedAt === null ? 'FETCHING...' : lsrs.length === 0 ? 'NO RECENT REPORTS' : 'NO MATCHING REPORTS';

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-2 py-1.5 border-b border-terminal-border shrink-0 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`retro-btn px-2 py-0.5 text-xs ${filter === f ? 'active' : ''}`}
          >
            {f}
          </button>
        ))}
        {fetchedAt && (
          <span className="ml-auto text-xs text-terminal-border self-center tabular-nums">
            {fetchedAt.toISOString().slice(11, 19)}Z
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-terminal-border">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sorted.map((lsr) => (
            <LsrRow key={lsr.id} lsr={lsr} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function LsrRow({ lsr, onSelect }: { lsr: LocalStormReport; onSelect: (l: LocalStormReport) => void }) {
  const color = LSR_COLORS[lsr.type];
  const ageMin = Math.round((Date.now() - lsr.time.getTime()) / 60000);

  return (
    <button
      onClick={() => onSelect(lsr)}
      className="w-full text-left px-3 py-2 border-b border-terminal-border-dim hover:bg-phosphor-dark transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold shrink-0" style={{ color }}>
          ◆ {lsr.type}
        </span>
        <span className="text-xs tabular-nums shrink-0 text-phosphor-dim">
          {ageMin < 60 ? `${ageMin}M AGO` : `${Math.round(ageMin / 60)}H AGO`}
        </span>
      </div>
      <div className="text-xs text-phosphor-dim mt-0.5 truncate">
        {lsr.magnitude ? `${lsr.magnitude} · ` : ''}{lsr.location}
      </div>
    </button>
  );
}

function LsrDetail({ lsr, onBack }: { lsr: LocalStormReport; onBack: () => void }) {
  const color = LSR_COLORS[lsr.type];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-terminal-border shrink-0">
        <button onClick={onBack} className="text-xs text-phosphor-dim hover:text-phosphor mb-1">
          ← BACK TO LIST
        </button>
        <div className="text-xs font-bold" style={{ color }}>
          {lsr.type}
        </div>
        <div className="text-xs text-phosphor-dim">{lsr.remarks}</div>
      </div>

      <div className="px-3 py-2 border-b border-terminal-border text-xs text-phosphor-dim shrink-0 space-y-0.5">
        <div>
          TIME: <span className="text-phosphor">{lsr.time.toISOString().slice(0, 16).replace('T', ' ')}Z</span>
        </div>
        <div>
          LOCATION: <span className="text-phosphor">{lsr.location}</span>
        </div>
        {lsr.magnitude && (
          <div>
            MAGNITUDE: <span className="text-phosphor">{lsr.magnitude}</span>
          </div>
        )}
        <div>
          LAT/LON: <span className="text-phosphor tabular-nums">{lsr.lat.toFixed(2)}N {Math.abs(lsr.lon).toFixed(2)}W</span>
        </div>
        <div>
          SOURCE: <span className="text-phosphor">{lsr.source}</span>
        </div>
      </div>
    </div>
  );
}

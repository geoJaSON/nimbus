import { useState } from 'react';
import { useScitStore } from '../../store/scitStore';
import { dbzColor, isCellSevere } from '../../lib/scitData';
import { TerminalPanel } from '../shared/TerminalPanel';
import type { StormCell } from '../../types';

interface SCITPanelProps {
  onClose: () => void;
}

type CellFilter = 'ALL' | 'SEVERE' | 'TVS' | 'MESO' | 'HAIL';

const FILTERS: CellFilter[] = ['ALL', 'SEVERE', 'TVS', 'MESO', 'HAIL'];

export function SCITPanel({ onClose }: SCITPanelProps) {
  const cells = useScitStore((s) => s.cells);
  const fetchedAt = useScitStore((s) => s.fetchedAt);
  const selectedCellId = useScitStore((s) => s.selectedCellId);
  const selectCell = useScitStore((s) => s.selectCell);
  const [filter, setFilter] = useState<CellFilter>('ALL');

  const selected = cells.find((c) => c.id === selectedCellId) ?? null;

  return (
    <TerminalPanel title={`SCIT (${cells.length})`} onClose={onClose} width="w-80">
      {selected ? (
        <CellDetail cell={selected} onBack={() => selectCell(null)} />
      ) : (
        <CellList
          cells={cells}
          filter={filter}
          onFilter={setFilter}
          onSelect={(c) => selectCell(c.id)}
          fetchedAt={fetchedAt}
        />
      )}
    </TerminalPanel>
  );
}

function applyFilter(cells: StormCell[], filter: CellFilter): StormCell[] {
  switch (filter) {
    case 'SEVERE':
      return cells.filter(isCellSevere);
    case 'TVS':
      return cells.filter((c) => c.tvs !== 'NONE');
    case 'MESO':
      return cells.filter((c) => c.meso !== 'NONE');
    case 'HAIL':
      return cells.filter((c) => c.posh >= 30 || c.maxHailSize >= 0.75);
    default:
      return cells;
  }
}

function CellList({
  cells,
  filter,
  onFilter,
  onSelect,
  fetchedAt,
}: {
  cells: StormCell[];
  filter: CellFilter;
  onFilter: (f: CellFilter) => void;
  onSelect: (c: StormCell) => void;
  fetchedAt: Date | null;
}) {
  const filtered = applyFilter(cells, filter);
  const sorted = [...filtered].sort((a, b) => b.maxDbz - a.maxDbz);

  const emptyMessage =
    fetchedAt === null ? 'FETCHING...' : cells.length === 0 ? 'NO CELLS IN RANGE' : 'NO MATCHING CELLS';

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
          {sorted.map((c) => (
            <CellRow key={c.id} cell={c} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function CellRow({ cell, onSelect }: { cell: StormCell; onSelect: (c: StormCell) => void }) {
  const color = dbzColor(cell.maxDbz);
  const severe = isCellSevere(cell);

  return (
    <button
      onClick={() => onSelect(cell)}
      className="w-full text-left px-3 py-2 border-b border-terminal-border-dim hover:bg-phosphor-dark transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-bold shrink-0 ${severe ? 'animate-blink' : ''}`} style={{ color }}>
          ● {cell.id}
        </span>
        <span className="text-xs tabular-nums shrink-0 text-phosphor-dim">
          {cell.maxDbz}dBZ · TOP {cell.top.toFixed(0)}K
        </span>
      </div>
      <div className="flex gap-2 mt-0.5 text-xs text-phosphor-dim">
        <span>VIL {cell.vil}</span>
        {cell.posh > 0 && <span className="text-amber">POSH {cell.posh}%</span>}
        {cell.tvs !== 'NONE' && <span className="text-warn-tornado font-bold">TVS</span>}
        {cell.meso !== 'NONE' && <span className="text-warn-svr font-bold">MESO</span>}
        <span className="ml-auto tabular-nums">{cell.motionDir}°/{cell.motionSpeed}kt</span>
      </div>
    </button>
  );
}

function CellDetail({ cell, onBack }: { cell: StormCell; onBack: () => void }) {
  const color = dbzColor(cell.maxDbz);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-terminal-border shrink-0">
        <button onClick={onBack} className="text-xs text-phosphor-dim hover:text-phosphor mb-1">
          ← BACK TO LIST
        </button>
        <div className="text-xs font-bold" style={{ color }}>
          ● CELL {cell.id} · {cell.radarId}
        </div>
        <div className="text-xs text-phosphor-dim">
          {cell.azimuth}° / {cell.range} NM FROM RADAR
        </div>
      </div>

      <div className="px-3 py-2 border-b border-terminal-border text-xs text-phosphor-dim shrink-0 space-y-0.5">
        <div>MAX dBZ: <span className="text-phosphor tabular-nums">{cell.maxDbz}</span> @ <span className="text-phosphor tabular-nums">{cell.maxDbzHeight.toFixed(1)}K FT</span></div>
        <div>TOP: <span className="text-phosphor tabular-nums">{cell.top.toFixed(1)} K FT</span></div>
        <div>VIL: <span className="text-phosphor tabular-nums">{cell.vil}</span> kg/m²</div>
        <div>MOTION: <span className="text-phosphor tabular-nums">{cell.motionDir}° @ {cell.motionSpeed} KT</span></div>
        <div>POH: <span className="text-phosphor tabular-nums">{cell.poh}%</span> · POSH: <span className={cell.posh >= 50 ? 'text-amber tabular-nums' : 'text-phosphor tabular-nums'}>{cell.posh}%</span></div>
        {cell.maxHailSize > 0 && (
          <div>MAX HAIL: <span className="text-amber tabular-nums">{cell.maxHailSize.toFixed(2)}″</span></div>
        )}
        <div>TVS: <span className={cell.tvs !== 'NONE' ? 'text-warn-tornado font-bold' : 'text-phosphor'}>{cell.tvs}</span></div>
        <div>MESO: <span className={cell.meso !== 'NONE' ? 'text-warn-svr font-bold' : 'text-phosphor'}>{cell.meso}</span></div>
        <div>POSITION: <span className="text-phosphor tabular-nums">{cell.lat.toFixed(2)}N {Math.abs(cell.lon).toFixed(2)}W</span></div>
        <div>VALID: <span className="text-phosphor tabular-nums">{cell.valid.toISOString().slice(11, 19)}Z</span></div>
      </div>
    </div>
  );
}

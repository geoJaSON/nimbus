import { useMcdStore } from '../../store/mcdStore';
import { useUIStore } from '../../store/uiStore';
import { polygonBounds } from '../../lib/geoBounds';
import { TerminalPanel } from '../shared/TerminalPanel';
import type { MesoscaleDiscussion } from '../../types';

interface MCDPanelProps {
  onClose: () => void;
}

export function MCDPanel({ onClose }: MCDPanelProps) {
  const mcds = useMcdStore((s) => s.mcds);
  const fetchedAt = useMcdStore((s) => s.fetchedAt);
  const selectedMcdNum = useMcdStore((s) => s.selectedMcdNum);
  const selectMcd = useMcdStore((s) => s.selectMcd);
  const focusMap = useUIStore((s) => s.focusMap);

  const selected = mcds.find((m) => m.productNum === selectedMcdNum) ?? null;

  const handleSelect = (m: MesoscaleDiscussion) => {
    selectMcd(m.productNum);
    if (m.polygon) {
      const bounds = polygonBounds(m.polygon);
      if (bounds) focusMap({ key: `mcd-${m.productNum}-${Date.now()}`, kind: 'bounds', bounds });
    }
  };

  return (
    <TerminalPanel title={`MCD (${mcds.length})`} onClose={onClose} width="w-80">
      {selected ? (
        <McdDetail mcd={selected} onBack={() => selectMcd(null)} />
      ) : (
        <McdList mcds={mcds} onSelect={handleSelect} fetchedAt={fetchedAt} />
      )}
    </TerminalPanel>
  );
}

function McdList({
  mcds,
  onSelect,
  fetchedAt,
}: {
  mcds: MesoscaleDiscussion[];
  onSelect: (m: MesoscaleDiscussion) => void;
  fetchedAt: Date | null;
}) {
  const sorted = [...mcds].sort((a, b) => b.issued.getTime() - a.issued.getTime());

  const emptyMessage = fetchedAt === null ? 'FETCHING...' : 'NO ACTIVE MCDs';

  return (
    <div className="flex flex-col h-full">
      {fetchedAt && (
        <div className="px-3 py-1.5 border-b border-terminal-border shrink-0 flex items-center">
          <span className="text-xs text-terminal-border">SPC NORMAN OK</span>
          <span className="ml-auto text-xs text-terminal-border tabular-nums">
            {fetchedAt.toISOString().slice(11, 19)}Z
          </span>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-terminal-border">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sorted.map((m) => (
            <McdRow key={m.productNum} mcd={m} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function McdRow({ mcd, onSelect }: { mcd: MesoscaleDiscussion; onSelect: (m: MesoscaleDiscussion) => void }) {
  const expiresInMin = Math.round((mcd.expires.getTime() - Date.now()) / 60000);
  const watchLikely = mcd.watchConfidence !== null && mcd.watchConfidence >= 60;

  return (
    <button
      onClick={() => onSelect(mcd)}
      className="w-full text-left px-3 py-2 border-b border-terminal-border-dim hover:bg-phosphor-dark transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-bold shrink-0 ${watchLikely ? 'text-warn-svr' : 'text-amber'}`}>
          ◆ MCD #{mcd.productNum}
        </span>
        <span className="text-xs tabular-nums shrink-0 text-phosphor-dim">
          EXP {expiresInMin}M
        </span>
      </div>
      <div className="text-xs text-phosphor-dim mt-0.5 line-clamp-2 leading-tight">
        {mcd.concerning}
      </div>
      {mcd.watchConfidence !== null && (
        <div className="text-xs text-phosphor-dim mt-0.5">
          WATCH PROB: <span className={watchLikely ? 'text-warn-svr font-bold' : 'text-amber'}>{mcd.watchConfidence}%</span>
        </div>
      )}
    </button>
  );
}

function McdDetail({ mcd, onBack }: { mcd: MesoscaleDiscussion; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-terminal-border shrink-0">
        <button onClick={onBack} className="text-xs text-phosphor-dim hover:text-phosphor mb-1">
          ← BACK TO LIST
        </button>
        <div className="text-xs font-bold text-amber">◆ MCD #{mcd.productNum}</div>
        <div className="text-xs text-phosphor-dim">{mcd.concerning}</div>
      </div>

      <div className="px-3 py-2 border-b border-terminal-border text-xs text-phosphor-dim shrink-0 space-y-0.5">
        <div>ISSUED: <span className="text-phosphor">{mcd.issued.toISOString().slice(0, 16).replace('T', ' ')}Z</span></div>
        <div>EXPIRES: <span className="text-phosphor">{mcd.expires.toISOString().slice(0, 16).replace('T', ' ')}Z</span></div>
        {mcd.watchConfidence !== null && (
          <div>WATCH PROB: <span className="text-phosphor">{mcd.watchConfidence}%</span></div>
        )}
        {mcd.mostProbTornado && (
          <div>PROB TOR: <span className="text-phosphor">{mcd.mostProbTornado}</span></div>
        )}
        {mcd.mostProbHail && (
          <div>PROB HAIL: <span className="text-phosphor">{mcd.mostProbHail}</span></div>
        )}
        {mcd.mostProbGust && (
          <div>PROB GUST: <span className="text-phosphor">{mcd.mostProbGust}</span></div>
        )}
      </div>

      {mcd.spcUrl && (
        <div className="px-3 py-2 text-xs text-phosphor-dim">
          <a href={mcd.spcUrl} target="_blank" rel="noopener noreferrer" className="text-amber hover:underline">
            OPEN FULL TEXT ON SPC.NOAA.GOV →
          </a>
        </div>
      )}
    </div>
  );
}

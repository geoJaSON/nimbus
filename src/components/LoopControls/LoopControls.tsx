import { useRadarStore } from '../../store/radarStore';
import { RetroButton } from '../shared/RetroButton';

export function LoopControls() {
  const loopFrames = useRadarStore((s) => s.loopFrames);
  const currentFrameIndex = useRadarStore((s) => s.currentFrameIndex);
  const isLoopPlaying = useRadarStore((s) => s.isLoopPlaying);
  const loopSpeed = useRadarStore((s) => s.loopSpeed);
  const scanTime = useRadarStore((s) => s.scanTime);
  const isLoadingTiles = useRadarStore((s) => s.isLoadingTiles);
  const setLoopPlaying = useRadarStore((s) => s.setLoopPlaying);
  const setLoopSpeed = useRadarStore((s) => s.setLoopSpeed);
  const setCurrentFrame = useRadarStore((s) => s.setCurrentFrame);
  const stepFrame = useRadarStore((s) => s.stepFrame);

  const frameCount = loopFrames.length;
  const frameNum = frameCount > 0 ? currentFrameIndex + 1 : 0;

  const scanAgeMs = scanTime ? Date.now() - scanTime.getTime() : null;
  const scanAgeMin = scanAgeMs !== null ? Math.floor(scanAgeMs / 60000) : null;
  const ageColor =
    scanAgeMin === null ? 'text-phosphor-dim' :
    scanAgeMin > 15 ? 'text-warn-tornado' :
    scanAgeMin > 5  ? 'text-amber' : 'text-phosphor-dim';

  const utcTime = scanTime
    ? scanTime.toISOString().slice(11, 19) + 'Z'
    : '--:--:--Z';

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    setCurrentFrame(Number(e.target.value));
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-terminal-border bg-terminal shrink-0 select-none">

      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <RetroButton
          onClick={() => setCurrentFrame(0)}
          title="Jump to first frame"
          className="px-1.5 py-0.5 text-xs"
        >
          |◀
        </RetroButton>
        <RetroButton
          onClick={() => stepFrame(-1)}
          title="Previous frame"
          className="px-1.5 py-0.5 text-xs"
        >
          ◀
        </RetroButton>
        <RetroButton
          active={isLoopPlaying}
          onClick={() => setLoopPlaying(!isLoopPlaying)}
          className="px-3 py-0.5 text-xs w-16 text-center"
          title={isLoopPlaying ? 'Pause' : 'Play'}
        >
          {isLoopPlaying ? '║║ PAUSE' : '▶ PLAY'}
        </RetroButton>
        <RetroButton
          onClick={() => stepFrame(1)}
          title="Next frame"
          className="px-1.5 py-0.5 text-xs"
        >
          ▶
        </RetroButton>
        <RetroButton
          onClick={() => setCurrentFrame(Math.max(0, frameCount - 1))}
          title="Jump to latest frame"
          className="px-1.5 py-0.5 text-xs"
        >
          ▶|
        </RetroButton>
      </div>

      {/* Scrubber */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={Math.max(0, frameCount - 1)}
          value={currentFrameIndex}
          onChange={handleScrub}
          disabled={frameCount === 0}
          className="flex-1 min-w-0 accent-phosphor cursor-pointer"
          style={{ height: '3px' }}
        />
      </div>

      {/* Frame counter */}
      <span className="text-xs text-phosphor-dim tabular-nums shrink-0">
        {isLoadingTiles
          ? <span className="text-amber animate-blink">LOADING</span>
          : <>{String(frameNum).padStart(2, '0')}/{String(frameCount).padStart(2, '0')}</>
        }
      </span>

      <div className="w-px h-4 bg-terminal-border shrink-0" />

      {/* Timestamp + age */}
      <span className={`text-xs tabular-nums shrink-0 ${ageColor}`}>
        {utcTime}
        {scanAgeMin !== null && (
          <span className="ml-1 text-phosphor-dim">+{scanAgeMin}M</span>
        )}
      </span>

      <div className="w-px h-4 bg-terminal-border shrink-0" />

      {/* Speed control */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-terminal-border">SPD</span>
        <input
          type="range"
          min={1}
          max={10}
          value={loopSpeed}
          onChange={(e) => setLoopSpeed(Number(e.target.value))}
          className="w-20 accent-phosphor cursor-pointer"
          style={{ height: '3px' }}
          title={`Loop speed: ${loopSpeed}/10`}
        />
        <span className="text-xs text-phosphor-dim w-4 text-right tabular-nums">{loopSpeed}</span>
      </div>

    </div>
  );
}

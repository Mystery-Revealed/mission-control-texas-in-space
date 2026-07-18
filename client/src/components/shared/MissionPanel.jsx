// MissionPanel.jsx — the console-status panel that replaces a map (spec §1, §3).
// Two halves, both display-only (the server owns all gameplay truth):
//
//   1. YOUR CONSOLE — a small SVG scene of the Mission Control room. The wall
//      screen shows where the mission is right now (pad → climb → orbit →
//      splashdown); side consoles come online as Team grows; a GO/NO-GO light
//      strip reads all three meters as console-style status lights — pure
//      flourish, never the only signal (icon + color + text label on every
//      light, same as the meter bars above).
//
//   2. THE MISSION — the six phases as a simple list with the current phase
//      highlighted.

const STAGES = [
  { key: 'uplink',   name: 'Comms uplink steady',   icon: '📡', meter: 'mission',    at: 60 },
  { key: 'vitals',   name: 'Life support nominal',   icon: '❤️', meter: 'crewSafety', at: 60 },
  { key: 'backroom', name: 'Back room staffed up',   icon: '🖥️', meter: 'team',       at: 60 },
  { key: 'fullroom', name: 'The whole room trusts your calls', icon: '🎧', meter: 'team', at: 85 },
];

// Fixed phase design (client display only; titles mirror the adapter).
const PHASES = [
  { n: 1, title: 'Console Prep', date: 'T-minus one day' },
  { n: 2, title: 'Launch', date: 'Liftoff' },
  { n: 3, title: 'The Anomaly', date: 'Day 3 · deep space' },
  { n: 4, title: 'The Workaround', date: 'Day 3 · working the problem' },
  { n: 5, title: 'The Long Watch', date: 'The cruise home' },
  { n: 6, title: 'Reentry & Splashdown', date: 'The last hour' },
];

// What the big wall screen shows, by phase.
function screenFor(chapterIndex) {
  if (chapterIndex <= 0) return 'pad';
  if (chapterIndex === 1) return 'climb';
  if (chapterIndex === 2) return 'orbit-alert';
  if (chapterIndex === 3) return 'orbit-fix';
  if (chapterIndex === 4) return 'orbit';
  return 'reentry';
}

const LIGHT_META = {
  mission: { name: 'Mission', icon: '🚀' },
  crewSafety: { name: 'Crew Safety', icon: '❤️' },
  team: { name: 'Team', icon: '🎧' },
};

function statusOf(value) {
  if (value >= 60) return { key: 'go', label: 'GO' };
  if (value >= 30) return { key: 'caution', label: 'CAUTION' };
  return { key: 'nogo', label: 'NO-GO' };
}

export default function MissionPanel({ meters, chapterIndex = 0 }) {
  const built = (s) => (meters?.[s.meter] ?? 50) >= s.at;
  const cur = Math.max(0, Math.min(PHASES.length - 1, chapterIndex));
  const screen = screenFor(cur);

  const hasUplink = built(STAGES[0]);
  const hasVitals = built(STAGES[1]);
  const hasBackroom = built(STAGES[2]);
  const hasFullRoom = built(STAGES[3]);

  return (
    <div className="mission-panel">
      <div className="mission-scene-wrap">
        <div className="panel-title">Your console</div>
        <svg
          className="mission-scene"
          viewBox="0 0 300 170"
          role="img"
          aria-label={`Mission Control at ${PHASES[cur].title}.${hasBackroom ? ' Back room consoles are online.' : ''}${hasFullRoom ? ' The whole room is engaged.' : ''}`}
        >
          {/* the room */}
          <rect x="0" y="0" width="300" height="170" className="mc-bg" rx="10" />
          <rect x="0" y="140" width="300" height="30" className="mc-floor" rx="4" />

          {/* the big wall screen */}
          <rect x="70" y="10" width="160" height="66" rx="4" className="mc-wallscreen-frame" />
          <rect x="76" y="16" width="148" height="54" rx="2" className="mc-wallscreen-bg" />
          <g aria-hidden="true">
            {screen === 'pad' && (
              <g>
                <line x1="150" y1="60" x2="150" y2="66" className="mc-pad" />
                <rect x="146" y="34" width="8" height="26" rx="2" className="mc-rocket" />
                <path d="M146 34 L150 24 L154 34 Z" className="mc-rocket" />
              </g>
            )}
            {screen === 'climb' && (
              <g>
                <rect x="146" y="24" width="8" height="26" rx="2" className="mc-rocket" transform="rotate(-8 150 37)" />
                <path d="M144 48 L150 66 L156 48 Z" className="mc-flame" transform="rotate(-8 150 37)" />
              </g>
            )}
            {(screen === 'orbit-alert' || screen === 'orbit-fix' || screen === 'orbit') && (
              <g>
                {[...Array(6)].map((_, i) => (
                  <circle key={i} cx={82 + i * 24} cy={20 + (i % 3) * 14} r="0.9" className="mc-star" />
                ))}
                <ellipse cx="150" cy="46" rx="42" ry="16" className="mc-orbit-path" />
                <circle cx="188" cy="40" r="4" className={`mc-capsule ${screen === 'orbit-alert' ? 'alert' : ''}`} />
                {screen === 'orbit-alert' && <circle cx="188" cy="40" r="7" className="mc-alert-ring" />}
                {screen === 'orbit-fix' && <circle cx="188" cy="34" r="2" className="mc-fix-spark" />}
              </g>
            )}
            {screen === 'reentry' && (
              <g>
                <rect x="76" y="46" width="148" height="24" className="mc-water" />
                <circle cx="150" cy="38" r="4" className="mc-capsule" />
                <path d="M150 34 L136 20 M150 34 L150 16 M150 34 L164 20" className="mc-parachute" />
              </g>
            )}
          </g>

          {/* your console, front and center */}
          <g aria-hidden="true">
            <rect x="120" y="112" width="60" height="8" rx="2" className="mc-desk" />
            <rect x="126" y="100" width="20" height="14" rx="1" className="mc-monitor" />
            <rect x="154" y="100" width="20" height="14" rx="1" className="mc-monitor" />
            <path d="M144 130 q6 -10 12 0" className="mc-headset" />
            <circle cx="144" cy="130" r="2.4" className="mc-headset-cup" />
            <circle cx="156" cy="130" r="2.4" className="mc-headset-cup" />
          </g>

          {/* side consoles — the back room, lit as Team grows */}
          <g aria-hidden="true">
            {[36, 62, 88].map((x, i) => (
              <g key={`l${i}`} className={`mc-console ${hasBackroom ? 'lit' : ''} ${hasFullRoom ? 'full' : ''}`}>
                <rect x={x} y="118" width="22" height="7" rx="2" className="mc-desk" />
                <rect x={x + 3} y="107" width="16" height="11" rx="1" className="mc-monitor" />
              </g>
            ))}
            {[212, 238, 264].map((x, i) => (
              <g key={`r${i}`} className={`mc-console ${hasFullRoom ? 'lit full' : ''}`}>
                <rect x={x} y="118" width="22" height="7" rx="2" className="mc-desk" />
                <rect x={x + 3} y="107" width="16" height="11" rx="1" className="mc-monitor" />
              </g>
            ))}
          </g>

          {/* vitals lamp on your desk */}
          <circle cx="150" cy="118" r="2.6" className={`mc-vitals-lamp ${hasVitals ? 'on' : ''}`} />
        </svg>

        <div className="go-nogo-strip" role="list" aria-label="Console status lights">
          {Object.keys(LIGHT_META).map((k) => {
            const value = meters?.[k] ?? 50;
            const status = statusOf(value);
            const meta = LIGHT_META[k];
            return (
              <div key={k} role="listitem" className={`go-nogo-light ${status.key}`}>
                <span className="light-bulb" aria-hidden="true" />
                <span className="light-icon" aria-hidden="true">{meta.icon}</span>
                <span className="light-name">{meta.name}</span>
                <b className="light-label">{status.label}</b>
              </div>
            );
          })}
        </div>

        <div className="build-chips" role="list" aria-label="Systems status">
          {STAGES.map((s) => {
            const done = built(s);
            return (
              <div key={s.key} role="listitem" className={`build-chip ${done ? 'done' : ''}`}>
                <span aria-hidden="true">{s.icon}</span> {s.name}
                <b className="build-state">{done ? '✓ online' : 'standby'}</b>
              </div>
            );
          })}
        </div>
        <p className="build-hint">Your console grows as your <b>Mission</b>, <b>Crew Safety</b>, and <b>Team</b> meters grow.</p>
      </div>

      <div className="chapter-listing">
        <div className="panel-title">The mission</div>
        <ol className="chapter-list">
          {PHASES.map((c, i) => {
            const state = i < cur ? 'past' : i === cur ? 'current' : 'future';
            return (
              <li key={c.n} className={`chapter-item ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="chapter-dot" aria-hidden="true">{i < cur ? '✓' : c.n}</span>
                <span className="chapter-name">{c.title}</span>
                <span className="chapter-date">{c.date}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ResultScreen.jsx — the end of the mission. Two stories, in order: (1) how
// the mission fared (Mission Score + ending tier), (2) the score that
// matters to your teacher — accuracy — then the debrief: the honest history
// of JSC, Apollo 11, Apollo 13, the ISS era, and Texas's modern aerospace industry.

import { Art } from '../../services/assets.jsx';

const TIER_CLASS = { top: 'win', mid: 'mid', low: 'low' };

export default function ResultScreen({ state, onPlayAgain }) {
  const end = state.matchEnd;
  const meta = end.meta || state.match?.begin?.meta;
  const you = end.you;
  const ending = you.ending;
  const score = you.score ?? 0;

  return (
    <div className="card result-screen">
      <div className="event-kicker">Houston · Mission Control</div>
      <h1 className={`result-headline ${TIER_CLASS[ending.key] || 'mid'}`}>{ending.title}</h1>

      <Art name="ending.jpg" alt="Parachutes and a capsule floating over blue water on the big wall screen, the mission control room erupting in celebration, papers in the air" className="result-art" />

      <p className="fall-note">
        This game measured how well you worked the flight controller's
        method — calm, checklist, crew first — and whether the room could
        trust your calls. The mission didn't hinge on luck. It hinged on the
        method, and the controllers who trusted it read it early.
      </p>

      <div className="ending-block mission">
        <p>{ending.text}</p>
      </div>

      <div className="score-block" aria-label="Mission Score">
        <div className="score-head">
          <span className="score-title">🚀 Mission Score</span>
          <span className="score-num">{score}<span className="muted"> / 300</span></span>
        </div>
        <span className="score-bar-track">
          <span className={`score-bar ${TIER_CLASS[ending.key] || 'mid'}`} style={{ width: `${Math.min(100, (score / 300) * 100)}%` }} />
        </span>
        <div className="meter-final-row">
          {Object.entries(you.meters || {}).map(([k, v]) => (
            <span key={k} className="meter-final">{meta?.meters?.[k]?.name || k}: <b>{v}</b></span>
          ))}
        </div>
      </div>

      <div className="accuracy-block">
        <div className="accuracy-number">{you.accuracy}%</div>
        <div>
          <b>Your accuracy — the score your teacher sees.</b>
          <p>
            How well your calls matched the real flight controller's method —
            calm, checklist, crew first.
          </p>
        </div>
      </div>

      <div className="debrief">
        <h3>What really happened</h3>
        <p>{you.debrief}</p>
      </div>

      <div className="btn-col">
        <button className="btn big" onClick={onPlayAgain}>Fly the mission again</button>
        <p className="replay-nudge muted">Try new calls — can you bring the room to "Flight, We're GO"?</p>
      </div>
    </div>
  );
}

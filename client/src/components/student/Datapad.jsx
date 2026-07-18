// Datapad.jsx — the student game. A small state machine over socket pushes:
// title → how to play → join → (approval) → briefing → match (6 phases) → result.
// Everyone works the SAME console — there is no "pick" and no rival, so the
// class is one accuracy group. The server owns all truth; this component only
// renders what it's told.

import { useEffect, useReducer, useRef, useState } from 'react';
import { getSocket, emitAck, errorText } from '../../services/socket.js';
import { Art } from '../../services/assets.jsx';
import MatchView from './MatchView.jsx';
import ResultScreen from './ResultScreen.jsx';

// The one class-wide side. It matches the server's single variant key.
const SIDE = 'controller';

const initialState = {
  screen: 'title', // title | how | join | waiting_approval | briefing | match | result | ended
  joinCode: '',
  name: '',
  studentId: null,
  error: '',
  endedMessage: '',
  match: null,
  matchEnd: null,
};

function freshMatch(begin) {
  return {
    begin,
    map: begin.map,
    meters: begin.meters,
    eventCard: null,
    turn: null,
    feedback: null,
  };
}

// Merge live payloads (chapter:event, turn:begin, turn:resolution) into the match.
function mergeLive(match, payload) {
  const next = { ...match };
  if (payload.map) next.map = payload.map;
  if (payload.meters) next.meters = payload.meters;
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ui':
      return { ...state, ...action.patch };
    case 'joined':
      return {
        ...state,
        studentId: action.studentId,
        error: '',
        matchEnd: null,
        match: null,
        screen: action.approved ? 'briefing' : 'waiting_approval',
      };
    case 'approved':
      return { ...state, screen: state.screen === 'waiting_approval' ? 'briefing' : state.screen };
    case 'match:begin':
      return { ...state, screen: 'match', matchEnd: null, match: freshMatch(action.payload) };
    case 'chapter:event': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, eventCard: action.payload } };
    }
    case 'turn:begin': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, turn: action.payload } };
    }
    case 'turn:resolution': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, feedback: action.payload } };
    }
    case 'match:end': {
      // Hold the result until pending feedback is dismissed (chronological order).
      const showNow = !state.match?.feedback;
      return { ...state, matchEnd: action.payload, screen: showNow ? 'result' : state.screen };
    }
    case 'dismiss-feedback': {
      if (!state.match) return state;
      if (state.matchEnd) return { ...state, screen: 'result', match: { ...state.match, feedback: null } };
      return { ...state, match: { ...state.match, feedback: null } };
    }
    case 'dismiss-event':
      return state.match ? { ...state, match: { ...state.match, eventCard: null } } : state;
    case 'sync': {
      const s = action.sync;
      if (s.screen === 'waiting_approval') return { ...state, screen: 'waiting_approval' };
      if (s.screen === 'lobby') return { ...state, screen: 'briefing' };
      if (s.screen === 'result') return { ...state, screen: 'result', matchEnd: s.matchEnd };
      if (s.screen === 'match') {
        const match = freshMatch(s.matchBegin);
        return {
          ...state,
          screen: 'match',
          matchEnd: null,
          match: { ...match, eventCard: s.chapterEvent, turn: s.turn },
        };
      }
      return state;
    }
    case 'removed':
      return { ...initialState, screen: 'join', joinCode: state.joinCode, name: '', error: 'Your teacher removed you from the session. You can join again.' };
    case 'ended':
      return { ...initialState, screen: 'ended', endedMessage: 'Your teacher ended this session. Stand by — the console will be here when you return.' };
    case 'replay':
      // Re-join for another run (a fresh match); the server issues a new record.
      return { ...state, matchEnd: null, match: null, error: '', screen: 'briefing' };
    default:
      return state;
  }
}

export default function Datapad() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();
    const on = (event, type) => {
      const fn = (payload) => dispatch({ type, payload });
      socket.on(event, fn);
      return [event, fn];
    };
    const subs = [
      on('match:begin', 'match:begin'),
      on('chapter:event', 'chapter:event'),
      on('turn:begin', 'turn:begin'),
      on('turn:resolution', 'turn:resolution'),
      on('match:end', 'match:end'),
    ];
    const approved = () => dispatch({ type: 'approved' });
    const removed = () => dispatch({ type: 'removed' });
    const ended = () => dispatch({ type: 'ended' });
    socket.on('join:approved', approved);
    socket.on('student:removed', removed);
    socket.on('session:ended', ended);

    // School wifi blip: the socket reconnects → re-attach and re-sync the screen.
    const onReconnect = async () => {
      const s = stateRef.current;
      if (!s.studentId || !s.joinCode) return;
      const res = await emitAck('student:rejoin', { joinCode: s.joinCode, studentId: s.studentId });
      if (res.ok) dispatch({ type: 'sync', sync: res.sync });
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      for (const [event, fn] of subs) socket.off(event, fn);
      socket.off('join:approved', approved);
      socket.off('student:removed', removed);
      socket.off('session:ended', ended);
      socket.io.off('reconnect', onReconnect);
    };
  }, []);

  // The one join call — mode solo, the single class-wide side. Join and replay.
  async function doJoin(joinCode, name) {
    const res = await emitAck('student:join', {
      joinCode: (joinCode || '').trim(), nickname: (name || '').trim(), mode: 'solo', nation: SIDE,
    });
    if (!res.ok) {
      dispatch({ type: 'ui', patch: { error: errorText(res.error), screen: 'join' } });
      return false;
    }
    dispatch({ type: 'joined', studentId: res.studentId, approved: res.approved });
    return true;
  }

  function playAgain() {
    const s = stateRef.current;
    dispatch({ type: 'replay' });
    doJoin(s.joinCode, s.name);
  }

  const { screen } = state;
  return (
    <div className="app student-app">
      {screen === 'title' && <TitleScreen onStart={() => dispatch({ type: 'ui', patch: { screen: 'join' } })} onHow={() => dispatch({ type: 'ui', patch: { screen: 'how' } })} />}
      {screen === 'how' && <HowToPlay onBack={() => dispatch({ type: 'ui', patch: { screen: 'title' } })} />}
      {screen === 'join' && <JoinForm state={state} dispatch={dispatch} onJoin={doJoin} />}
      {screen === 'waiting_approval' && (
        <WaitCard title="Hold tight!" text="Your teacher is checking names. Your console comes online in a moment." />
      )}
      {screen === 'briefing' && (
        <WaitCard title="Launch is tomorrow." text="A quiet room, a row of glowing screens, and one seat with your name on it. Your first checklist is being drawn up. Stand ready." />
      )}
      {screen === 'match' && state.match && <MatchView state={state} dispatch={dispatch} />}
      {screen === 'result' && state.matchEnd && <ResultScreen state={state} onPlayAgain={playAgain} />}
      {screen === 'ended' && (
        <WaitCard title="Session ended" text={state.endedMessage}>
          <button className="btn" onClick={() => dispatch({ type: 'ui', patch: { ...initialState, screen: 'title' } })}>
            Back to the title screen
          </button>
        </WaitCard>
      )}
      <footer className="app-footer">Made for 7th Grade Texas History · TEKS 7.12C, 7.19A, 7.19C, 7.19E, 7.7E</footer>
    </div>
  );
}

/* ---------------- small screens ---------------- */

function TitleScreen({ onStart, onHow }) {
  return (
    <div className="card title-screen">
      <Art name="title_hero.jpg" alt="A mission control room at night, rows of glowing consoles facing a huge world-map screen, one young controller in a headset lit by the displays" className="hero-art" />
      <h1 className="game-title">Mission Control: Texas in Space</h1>
      <p className="tagline">"Houston" was the first word spoken from the Moon. Tonight, Houston is you.</p>
      <p className="title-blurb">
        You are a young flight controller at NASA's <b>Johnson Space Center</b> in
        Houston. Tonight your console goes live for a full mission — launch,
        a problem nobody planned for, a long watch, and a splashdown. Real
        flight controllers work by a method: stay calm, follow the checklist,
        and put crew safety above everything else. Take your seat, work the
        problem the way Houston really does, and find out why the road to
        space runs through Texas.
      </p>
      <div className="btn-col">
        <button className="btn big" onClick={onStart}>Join your class</button>
        <button className="btn secondary" onClick={onHow}>How to play</button>
      </div>
    </div>
  );
}

function HowToPlay({ onBack }) {
  return (
    <div className="card how-screen">
      <h2>How to play</h2>
      <ol className="how-list">
        <li><b>Join with your class code</b> — everyone works the same mission, but every call is yours alone.</li>
        <li><b>Live 6 phases</b>, from console prep to splashdown. Each phase you make <b>two calls</b> — pick 1 of 3 answers to a hard question.</li>
      </ol>
      <div className="how-grid">
        <div className="how-card"><span className="how-icon">❤️</span><b>Crew Safety always comes first</b><p>In real Mission Control, no schedule ever outranks the crew. When a call is between "on time" and "safe," safe wins — every time.</p></div>
        <div className="how-card"><span className="how-icon">🚀</span><b>Watch your console light up</b><p>Every choice moves your meters up or down. Call it calm, follow the checklist, and trust your team, and you'll see your console — and the room's trust in you — grow.</p></div>
      </div>
      <h3>Your three meters</h3>
      <ul className="how-list">
        <li>🚀 <b>Mission</b> — your objectives, on track or not. Careful checklist work keeps it climbing; guessing and delay cost it.</li>
        <li>❤️ <b>Crew Safety</b> — the crew's wellbeing. It always outranks the other two meters. Working the problem calmly protects it; rushing costs it most.</li>
        <li>🎧 <b>Team</b> — the room's trust in your calls. Clear calls on the loop and honest handoffs build it; talking over teammates or going silent costs it.</li>
      </ul>
      <div className="note">
        <b>Live the story, learn the history.</b> Your <b>Mission Score</b> is simply
        your three meters added together — but what your teacher really sees
        is whether you can spot the calm, checklist answer when the tempting
        one is right beside it. Real flight controllers already ran this
        experiment, for real missions. See if you can match their method.
      </div>
      <h3>Words to know</h3>
      <ul className="how-list">
        <li><b>Flight controller</b> — an expert who watches one part of a spacecraft's systems from a console on the ground and calls out problems the instant they appear.</li>
        <li><b>The loop</b> — the shared radio channel every controller listens to. Calls happen in order, one voice at a time, so nothing gets missed.</li>
        <li><b>GO/NO-GO poll</b> — the Flight Director calling every console by name to ask if it's safe to proceed. Every console answers with real data, not a guess.</li>
        <li><b>Work the problem</b> — the controller's method for a real emergency: stay calm, gather facts, and solve it step by step instead of guessing out loud.</li>
        <li><b>Anomaly</b> — a reading that doesn't match what the plan says should happen. Every anomaly gets chased down, no matter how small it looks.</li>
        <li><b>Tough and competent</b> — the creed Mission Control adopted after the Apollo 1 tragedy: tough, because controllers are forever accountable for what they do; competent, because they never take anything for granted.</li>
        <li><b>Reentry blackout</b> — a few minutes near the end of a mission when the heat of reentry blocks all radio signal. It's expected, and it always ends.</li>
        <li><b>Debrief</b> — an honest, blame-free meeting after a mission where the room names what to fix before the next one.</li>
      </ul>
      <button className="btn" onClick={onBack}>Back</button>
    </div>
  );
}

function JoinForm({ state, dispatch, onJoin }) {
  const [busy, setBusy] = useState(false);
  const set = (patch) => dispatch({ type: 'ui', patch });
  const ready = state.joinCode.length === 6 && state.name.trim().length >= 2;

  async function join() {
    if (!ready || busy) return;
    setBusy(true);
    const ok = await onJoin(state.joinCode, state.name);
    if (!ok) setBusy(false);
  }

  return (
    <div className="card join-screen">
      <h2>Join your class</h2>
      <label htmlFor="join-code">Class code</label>
      <input
        id="join-code" inputMode="numeric" autoComplete="off" maxLength={6}
        placeholder="6-digit code" value={state.joinCode}
        onChange={(e) => set({ joinCode: e.target.value.replace(/\D/g, '') })}
      />
      <label htmlFor="join-name">Your first name</label>
      <input
        id="join-name" maxLength={20} placeholder="e.g. Ana R." value={state.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <p className="muted">Everyone works the same mission. Stay calm, work the problem.</p>

      <p className="err" role="alert">{state.error}</p>
      <div className="btn-col">
        <button className="btn big" disabled={!ready || busy} onClick={join}>
          {busy ? 'Powering up…' : 'Take your console →'}
        </button>
        <button className="btn ghost" onClick={() => set({ screen: 'title', error: '' })}>Back</button>
      </div>
    </div>
  );
}

function WaitCard({ title, text, children }) {
  return (
    <div className="card wait-card">
      <div className="pulse-dot" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}

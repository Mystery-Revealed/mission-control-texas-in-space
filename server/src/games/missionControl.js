// missionControl.js — Unit 7 game adapter: "Mission Control: Texas in Space"
// (SOLO, one class-wide group). Everyone plays the same young flight
// controller at NASA's Johnson Space Center, working one full mission from
// console prep to splashdown. Six phases × 2 graded decisions = 12 graded
// actions. There is no "pick" and no rival — the whole class works the same
// mission, so the Teacher Command Center reports ONE accuracy group.
//
// THE TEACHING IDEA (spec §1): the game teaches the real flight-controller
// method — checklists, calm call-and-response over the loop, "work the
// problem" instead of guessing, and Crew Safety always outranking the
// schedule — as living proof of TEKS 7.19's technology-and-society standard.
// Right answers are the calm, checklist, crew-first answers, because that is
// how NASA's Mission Control really operates.
//
// THE ANSWER KEY LIVES HERE, ON THE SERVER (verdicts/effects/feedback). The
// factory ships labels only; the client submits { kind, choiceIndex }.
// Student-facing text is written at a 5th grade reading level.
//
// Every step is a 'decision' — a judgment call. This is a console-status
// game, not a map. ✅ right (+1) · ⚠️ partial (+0.5) · ❌ wrong (0).
//
// No failCheck / failEnding: this is a straight choice-driven game — the
// meters rise and fall with every call, and all 12 actions always play out.

import { createStepGame } from './_stepGame.js';

// ---------------------------------------------------------------------------
// Shared board metadata (shipped to clients at match:begin — display info only)
// ---------------------------------------------------------------------------

export const METERS = {
  mission:    { name: 'Mission',     icon: 'mission',    blurb: 'Your objectives — how well the mission itself stays on track. Careful checklist work keeps it climbing; guesses and delay cost it.' },
  crewSafety: { name: 'Crew Safety', icon: 'crewSafety', blurb: 'The crew’s wellbeing — the meter that always outranks the others. Working the problem calmly protects it; guessing or rushing costs it most.' },
  team:       { name: 'Team',        icon: 'team',       blurb: 'The room’s trust in your calls. Clear calls on the loop and honest handoffs build it; talking over teammates or going silent costs it.' },
};

// This game has no map, so there are no placed markers. Kept for engine symmetry.
export const MARKERS = {
  console: { name: 'Your console' },
};

// All three meters begin at 50: a clean console, a healthy crew, and a room
// that hasn't seen you work yet.
const START_METERS = { mission: 50, crewSafety: 50, team: 50 };

// Mission Score = mission + crewSafety + team (max 300).
export function missionScore(meters) {
  return (meters.mission || 0) + (meters.crewSafety || 0) + (meters.team || 0);
}

// Ending tier from the final Mission Score (spec §3).
export const ENDINGS = {
  top: { key: 'top', title: 'Flight, We’re GO',
         text: 'You flew this mission the way the room teaches it: calm on the loop, honest in the polls, crew first every single time. When the anomaly hit, you called it fast and worked it slow, and the room moved with you like one machine. The Flight Director doesn’t hand out praise easily, but tonight there’s a nod aimed at your console. The crew is home because of choices exactly like yours. Tough and competent — you just showed what those words mean.' },
  mid: { key: 'mid', title: 'Splashdown',
         text: 'The capsule is bobbing in the ocean and the crew is safe — that’s the headline, and it’s a good one. Your run wasn’t perfect: a few calls came late, a few came from the gut instead of the data, and the room had to steady itself once or twice. But you stayed on console, you kept working the problem, and the method held. In the debrief, you’ll name your misses out loud, because that’s how controllers get better. Next mission, you’ll be sharper — and there is always a next mission.' },
  low: { key: 'low', title: 'Long Night in the Trench',
         text: 'This one was rough. Missed calls made small problems bigger, shaky handoffs left holes in the watch, and the room spent long hours catching what your console dropped. But here is the thing about Mission Control: the system is built so that one hard night cannot sink a mission, and it didn’t — the checklists held, your teammates held, and the crew came home safe. The mission cost more than it should have, and the debrief will say so honestly, without blame. Tonight you read the logs. Tomorrow you take the console again, tougher and more competent than you were.' },
};

export function endingFor(score) {
  if (score >= 200) return ENDINGS.top;
  if (score >= 110) return ENDINGS.mid;
  return ENDINGS.low;
}

// The universal debrief: the true history behind every beat, tying the
// content bank together (TEKS 7.12C, 7.19A/C/E).
export const DEBRIEF =
  'The room you just worked is real. NASA built the Johnson Space Center in Houston between 1961 and 1963, and it made Houston "Space City" — home of astronaut training and Mission Control. In 1969, the first words from the Moon came straight to this city: "Houston, Tranquility Base here… the Eagle has landed." After the Apollo 1 tragedy, the controllers made a creed: "tough and competent" — tough because they are forever accountable for what they do, competent because they never take anything for granted. In 1970, Apollo 13 called down, "Houston, we’ve had a problem," and the room answered by working the problem — powering down, taking inventory, building an air filter from spare parts, checklist by checklist, until the crew came home. That same room went on to fly the space shuttle, and today it runs the American side of the International Space Station every hour of every day. Around it grew thousands of Texas aerospace jobs — engineers, contractors, and a commercial-space boom stretching from Houston all the way to the rockets of Boca Chica. Space technology even flows back into daily life, and JSC works side by side with Houston’s hospitals on real medical tools. Texas gave spaceflight more than a building. It gave spaceflight the controller’s method — calm, checklist, crew first.';

// ===========================================================================
// THE SIX PHASES of one mission. Player-facing text at a 5th grade reading level.
// ===========================================================================

const PHASES = [
  // ---- Phase 1 — Console Prep (T-minus one day) ----
  {
    title: 'Console Prep', date: 'T-minus one day', image: 'event_trench.jpg',
    event: 'Launch is tomorrow. You settle in for one last simulation before the real thing. Near the end, your screen flickers strangely for two seconds — then looks normal again. Tonight is your last chance to chase it down.',
    steps: [
      {
        kind: 'decision',
        prompt: 'Your console’s telemetry looked odd for two seconds in tonight’s simulation. What do you do?',
        choices: [
          { label: 'Flag it, pull the data, and run the checklist with your back-room team tonight.',
            verdict: 'right', effects: { team: 10, mission: 5 },
            feedback: 'Controllers chase every anomaly to ground. "It was probably nothing" isn’t in the vocabulary.' },
          { label: 'Watch for it again during launch.',
            verdict: 'partial', effects: { mission: 5, team: -5 },
            feedback: 'Watching is not the same as knowing.' },
          { label: 'Two seconds? Let it go.',
            verdict: 'wrong', effects: { crewSafety: -10 },
            feedback: 'The two-second blips are how big days go wrong.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The next morning, minutes before launch, the Flight Director opens the GO/NO-GO poll. Your data is clean, but a gut feeling nags at you. When your console is called, what do you say?',
        choices: [
          { label: 'Call "GO" on the data.',
            verdict: 'right', effects: { team: 10 },
            feedback: 'Gut feelings get logged. The poll runs on evidence.' },
          { label: 'Call "NO-GO" on the feeling.',
            verdict: 'partial', effects: { team: -5 },
            feedback: 'The room respects caution — but it asks for the data, not just the feeling.' },
          { label: 'Stay silent when your console is called.',
            verdict: 'wrong', effects: { team: -10 },
            feedback: 'A silent console is a hole in the wall.' },
        ],
      },
    ],
  },

  // ---- Phase 2 — Launch ----
  {
    title: 'Launch', date: 'Liftoff', image: 'event_launch.jpg',
    event: 'It is launch morning. The room is quiet and bright, and every console is staffed. You wear a headset tuned to "the loop" — the shared radio channel where every call is heard by the whole room. In minutes, the Flight Director will poll every console: GO or NO-GO.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The Flight Director starts the GO/NO-GO poll, calling each console in a set order. Your console is fifth in line — and your data is perfect. When do you speak?',
        choices: [
          { label: 'Hold your call until the Flight Director says your console’s name, then answer clearly.',
            verdict: 'right', effects: { team: 10, mission: 8 },
            feedback: 'The poll runs in strict order so every voice is heard, one at a time. Real controllers wait their turn even when they’re sure. On the loop, order isn’t politeness — it’s how nothing gets missed.' },
          { label: 'Jump in one spot early, since your answer is ready and it saves time.',
            verdict: 'partial', effects: { mission: 5, team: -5 },
            feedback: 'Speed feels helpful, but the poll isn’t about speed. Jumping the line steps on the console ahead of you — and their answer matters just as much as yours.' },
          { label: 'Call out "We’re GO, Flight!" before the poll even starts.',
            verdict: 'wrong', effects: { mission: -10, crewSafety: -5 },
            feedback: 'Two voices at once means somebody’s data gets lost. A controller who talks over the loop makes the whole room harder to hear.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The rocket is climbing. Your screens are clean. Then you glance at your neighbor’s console, and one of their numbers looks strange to you. What do you do?',
        choices: [
          { label: 'Keep your eyes on your own console and trust the expert sitting at that one.',
            verdict: 'right', effects: { team: 10, mission: 8 },
            feedback: 'Every console in the room is an expert voice on its own system. That controller knows their screens better than you ever will. Your job right now is the data in front of you — and the room is counting on you to watch it.' },
          { label: 'Split your attention and keep one eye on their screen, just in case.',
            verdict: 'partial', effects: { mission: 3, team: -5 },
            feedback: 'It feels careful, but a split focus is a weak focus. While you watch their numbers, who is watching yours?' },
          { label: 'Key up the loop and correct their call in front of the whole room.',
            verdict: 'wrong', effects: { team: -15 },
            feedback: 'Second-guessing a teammate over the loop chews up trust, and trust is what the room runs on. If controllers can’t rely on each other’s consoles, the whole method falls apart.' },
        ],
      },
    ],
  },

  // ---- Phase 3 — The Anomaly ----
  {
    title: 'The Anomaly', date: 'Day 3 · deep space', image: 'event_problem.jpg',
    event: 'The mission has settled into a rhythm. Then a number on your screen drops — the pressure in one of the spacecraft’s tanks is falling, and it should not be. This is an anomaly: a reading that doesn’t match what the plan says should happen. The room hasn’t seen it yet. You have.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The tank pressure is still dropping. What is your very first move?',
        choices: [
          { label: 'Call it on the loop now, ask Flight to hold the plan, and start working the problem step by step.',
            verdict: 'right', effects: { crewSafety: 15, team: 8 },
            feedback: 'This is the flight controller’s method at full speed: call it, freeze the plan, work the problem. Apollo 13 taught the world this exact move. Nobody in that room guessed — they worked.' },
          { label: 'Call it out, but add your best guess about the cause so the room can move faster.',
            verdict: 'partial', effects: { crewSafety: 3 },
            feedback: 'The fast call was right — the guess wasn’t. A guess spoken on the loop can send twenty experts chasing the wrong thing. Report what you see, not what you suspect.' },
          { label: 'Decide it’s probably a bad sensor and let the mission press on.',
            verdict: 'wrong', effects: { crewSafety: -20 },
            feedback: '"Probably a bad sensor" is a bet, and controllers don’t bet with a crew on board. If it’s real and you stayed quiet, the problem grows in the dark.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The leak is real. The spacecraft doesn’t have enough power for everything. The room must triage — that means choosing what to save first. What’s your call?',
        choices: [
          { label: 'Power down the non-essential systems by the checklist and protect life support first, even if it costs the schedule.',
            verdict: 'right', effects: { crewSafety: 15, mission: -3 },
            feedback: 'Crew Safety always outranks the mission timeline — always. A schedule can slip and be fixed. This is the rule the whole room is built on.' },
          { label: 'Run everything at half power and try to save the experiments and the crew at the same time.',
            verdict: 'partial', effects: { crewSafety: 5, mission: 3 },
            feedback: 'A little of everything sounds fair, but it protects nothing fully. When power is short, life support doesn’t share — it comes first, whole.' },
          { label: 'Keep the mission experiments running on schedule and sort out the power later.',
            verdict: 'wrong', effects: { crewSafety: -15, mission: 10 },
            feedback: '"Later" is how margins disappear. Every minute the experiments run, the crew’s air and heat lose ground. No objective on any checklist outranks the people in the spacecraft.' },
        ],
      },
    ],
  },

  // ---- Phase 4 — The Workaround ----
  {
    title: 'The Workaround', date: 'Day 3 · working the problem', image: 'event_workaround.jpg',
    event: 'The powered-down spacecraft has a new problem. The backup air filter is the wrong shape for its slot — it simply doesn’t fit. The crew needs clean air, and there is no store, no shipment, no help on the way. Whatever fixes this must already be on board.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The room turns to you. How does Mission Control find the fix?',
        choices: [
          { label: 'Take a careful inventory of every item actually on board, then engineer a fix from those real parts.',
            verdict: 'right', effects: { crewSafety: 12, mission: 8 },
            feedback: 'This is how the Apollo 13 team beat the same kind of problem: spread out only what the crew really had — hoses, tape, covers — and build from that. Real controllers work with what is, not what they wish they had. The answer is almost always already on board.' },
          { label: 'Rush the first idea that might work up to the crew to save precious time.',
            verdict: 'partial', effects: { mission: 3, crewSafety: -3 },
            feedback: 'Fast feels safe when the clock is loud. But a fix built on "might" can waste the parts you only get one chance to use. The inventory comes first.' },
          { label: 'Have the crew hang on and wait while you ask about sending up new parts.',
            verdict: 'wrong', effects: { crewSafety: -15, mission: 5 },
            feedback: 'There is no truck to space. The crew has hours, and a resupply takes weeks. Waiting is a choice, and here it’s the most dangerous one.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'Your team has a design that should work. How does it get from the ground to the crew?',
        choices: [
          { label: 'Build the fix on the ground in a mockup — an exact copy of the cabin — test it, then read the crew each step, one at a time.',
            verdict: 'right', effects: { crewSafety: 12, team: 8 },
            feedback: 'Mission Control never sends up a step it hasn’t already done with its own hands. Build it, test it, prove it — then talk the crew through it slowly. That’s why the famous Apollo 13 fix worked on the first try.' },
          { label: 'Talk the crew through the plan right away — it’s simple enough that testing can wait.',
            verdict: 'partial', effects: { crewSafety: 2, mission: 3 },
            feedback: '"Simple enough" is where surprises hide. If step four fails in space, the crew finds out the hard way. A tested fix costs an hour; an untested one can cost the fix itself.' },
          { label: 'Send up the parts list and let the crew invent the fix on their own.',
            verdict: 'wrong', effects: { crewSafety: -12, team: -8 },
            feedback: 'The crew is busy, tired, and cold — and the ground team is the crew’s other half. Leaving them to improvise alone throws away the room full of experts built for exactly this moment.' },
        ],
      },
    ],
  },

  // ---- Phase 5 — The Long Watch ----
  {
    title: 'The Long Watch', date: 'The cruise home', image: null,
    event: 'The emergency is stable, and now comes the long haul. The spacecraft must be watched every minute of every day, so controllers work in shifts — the same way Houston runs the International Space Station right now, around the clock. Your shift is ending. Your relief — the trained controller who takes your seat next — is at the door.',
    steps: [
      {
        kind: 'decision',
        prompt: 'You’ve been on console nine hours. Your relief is ready. Do you go?',
        choices: [
          { label: 'Hand over the console on schedule, go get real rest, and trust your relief to fly your system.',
            verdict: 'right', effects: { team: 12, crewSafety: 5 },
            feedback: 'The watch is built on rotation because tired eyes miss things. A rested relief is safer than an exhausted hero — every real controller knows it. Trusting the next shift is part of the job, not a break from it.' },
          { label: 'Stay a few extra hours past your rotation, just to be safe.',
            verdict: 'partial', effects: { team: 3, crewSafety: -2 },
            feedback: 'It feels loyal, but "just to be safe" quietly makes the room less safe. Is hour twelve of you really sharper than hour one of your relief? It isn’t.' },
          { label: 'Refuse to hand off at all — nobody knows this system like you do.',
            verdict: 'wrong', effects: { crewSafety: -10, team: -8 },
            feedback: 'A controller who won’t let go becomes the system’s single point of failure. When you finally crash, there’s no one warm on your console. Missions are flown by teams, not heroes.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'Before you leave the console, what does your relief get from you?',
        choices: [
          { label: 'Hand over a complete written log and walk your relief through every open item, number by number.',
            verdict: 'right', effects: { team: 10, mission: 5 },
            feedback: 'Handoff discipline means nothing gets lost between shifts. Your relief should see the mission exactly the way you see it before you stand up. On the ISS watch, Houston does this handoff every single day.' },
          { label: 'Give a quick verbal rundown — "pressure’s been drifting a little, watch it" — and head out.',
            verdict: 'partial', effects: { team: 3 },
            feedback: 'A vague handoff plants a seed of confusion. "A little" isn’t a number, and "watch it" isn’t a plan. Two shifts later, nobody remembers what normal looked like.' },
          { label: 'Leave without a briefing — the screens will tell the next shift everything.',
            verdict: 'wrong', effects: { team: -12, mission: -5 },
            feedback: 'Screens show the present; only you can hand over the past. Whatever you carried out that door, the room now has to rediscover the hard way.' },
        ],
      },
    ],
  },

  // ---- Phase 6 — Reentry & Splashdown ----
  {
    title: 'Reentry & Splashdown', date: 'The last hour', image: 'ending.jpg',
    event: 'The spacecraft turns toward Earth and dives into the atmosphere. The air around the capsule grows so hot it blocks all radio signal — a real physics fact called reentry blackout. For the next few minutes, the loop will be silent. There is nothing left to send up. Everything now rides on the work already done.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The loop goes silent, right on schedule. The room holds its breath. What do you do with the silence?',
        choices: [
          { label: 'Watch the clock, trust the preparation and the physics, and wait out the blackout calmly.',
            verdict: 'right', effects: { crewSafety: 10, team: 8 },
            feedback: 'The blackout is expected — it’s on the checklist, down to the minute. Real controllers trust the work: the trajectory was checked, the heat shield was checked, and the silence is just physics doing its job. Calm is a skill, and this is where it shows.' },
          { label: 'Start running contingency calls over the loop, so you’re doing something useful while you wait.',
            verdict: 'partial', effects: { team: -5, crewSafety: 2 },
            feedback: 'It feels productive, but no signal is getting through — you’re broadcasting nerves into a silent room. Busywork isn’t readiness. The checklist already told you what this moment needs: patience.' },
          { label: 'Start improvising new procedures mid-blackout, in case something has gone wrong up there.',
            verdict: 'wrong', effects: { crewSafety: -15, team: -10 },
            feedback: 'Procedures invented in a panic are guesses wearing uniforms. Nothing you write in these three minutes can reach the capsule anyway. The time to prepare was before — and you did prepare.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The parachutes bloom, the capsule splashes down, and the crew is safe. Cheers fill the room. What happens next?',
        choices: [
          { label: 'Gather the whole room for an honest debrief — name what to fix before next time, with no blame.',
            verdict: 'right', effects: { team: 15, mission: 10 },
            feedback: 'This is "tough and competent" in action. Tough: the room stays accountable for every call, even on its best day. Competent: it never takes anything for granted, so every lesson gets written down before the next crew climbs aboard.' },
          { label: 'Say "good job, everybody," shake hands, and save the details for another day.',
            verdict: 'partial', effects: { team: 5 },
            feedback: 'Celebration is earned — but a debrief with no details teaches nothing. Memory fades fast, and the lessons of today are the checklist of tomorrow.' },
          { label: 'Skip the debrief entirely — a safe splashdown means there’s nothing to talk about.',
            verdict: 'wrong', effects: { team: -10, mission: -5 },
            feedback: 'A success can hide a close call, and an unexamined close call comes back. Rooms that skip the hard look eventually get surprised. This room doesn’t.' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Assemble the single class-wide role into a one-variant game. One side, no
// rival — so the Command Center reports ONE class accuracy group (spec §1).
// ---------------------------------------------------------------------------

export const VARIANTS = {
  controller: {
    name: 'Your Console',
    sub: 'The flight controller on duty, working one full mission · console prep to splashdown',
    phases: PHASES,
    waypoints: [], // no map: the console status panel tells the story instead
  },
};

export { PHASES };

export default createStepGame({
  id: 'missionControl',
  title: 'Mission Control: Texas in Space',
  meters: METERS,
  markers: MARKERS,
  startMeters: () => ({ ...START_METERS }),
  scoreMeters: missionScore,
  endingFor,
  debrief: DEBRIEF,
  variants: VARIANTS,
  // No failCheck / failEnding: a straight choice-driven game — the meters rise
  // and fall with every call, and all 12 actions always play through.
});

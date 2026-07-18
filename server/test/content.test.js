// content.test.js — sanity + historical-balance checks on the Mission
// Control: Texas in Space content bank (spec §1–§6). One class-wide role (a
// flight controller), six phases, choice-based, with NO early-fail and NO
// scripted event tolls — every effect comes straight from the player's own call.
import test from 'node:test';
import assert from 'node:assert/strict';
import game, { PHASES, missionScore, endingFor, ENDINGS } from '../src/games/missionControl.js';

const SIDE = 'controller';

const allText = () =>
  PHASES.flatMap((p) => [p.event, ...p.steps.flatMap((s) => [s.prompt, ...s.choices.map((c) => `${c.label} ${c.feedback}`)])]).join(' ');

test('one class-wide role is the single side, with no rival', () => {
  assert.deepEqual(game.sides, [SIDE]);
  assert.equal(game.hasOpponent, false, 'everyone works the same mission — a single class-wide accuracy group');
  assert.equal(game.totalActions, 12);
  assert.equal(game.chapterCount, 6);
  assert.ok(game.meta.variants[SIDE], 'Your Console ships as the one variant');
  assert.deepEqual(game.meta.variants[SIDE].waypoints, [], 'no map: the console status panel replaces it');
});

test('six phases, each with an event and two graded decisions (right/partial/wrong)', () => {
  assert.equal(PHASES.length, 6, 'phase count');
  for (const [i, ph] of PHASES.entries()) {
    assert.ok(ph.title && ph.date && ph.event, `phase ${i} metadata`);
    assert.equal(ph.steps.length, 2, `phase ${i} has 2 steps`);
    for (const [j, step] of ph.steps.entries()) {
      assert.equal(step.kind, 'decision', `phase ${i} step ${j} is a decision (no map)`);
      assert.ok(step.prompt?.length > 5, `phase ${i} step ${j} prompt`);
      const verdicts = step.choices.map((c) => c.verdict).sort();
      assert.deepEqual(verdicts, ['partial', 'right', 'wrong'], `phase ${i} step ${j} verdicts`);
      for (const c of step.choices) {
        assert.ok(c.label?.length > 5 && c.feedback?.length > 10, `phase ${i} step ${j} choice text`);
      }
    }
  }
  const steps = PHASES.flatMap((p) => p.steps);
  assert.equal(steps.length, 12, '12 graded actions');
});

test('meters start at 50/50/50 — mission, crewSafety, team', () => {
  const state = game.initMatch({ soloSide: SIDE });
  assert.deepEqual(state.sides[SIDE].meters, { mission: 50, crewSafety: 50, team: 50 });
});

test('the content teaches the spec’s content bank (TEKS 7.12C, 7.19A/C/E)', () => {
  const text = allText();
  assert.match(text, /GO\/NO-GO poll|GO"|NO-GO/i, 'GO/NO-GO polling');
  assert.match(text, /work(ing)? the problem/i, 'work the problem');
  assert.match(text, /Apollo 13|we.ve had a problem/i, 'Apollo 13, 1970');
  assert.match(text, /International Space Station|ISS/i, 'Houston flies the ISS');
  const debrief = game.report(game.initMatch({ soloSide: SIDE })).perSide[SIDE].debrief;
  assert.match(debrief, /Johnson Space Center|JSC/i, 'debrief names JSC, Houston');
  assert.match(debrief, /1961|1963/, 'debrief names JSC’s 1961–63 opening');
  assert.match(debrief, /Tranquility Base|Eagle has landed/i, 'debrief names the 1969 Apollo 11 moment');
  assert.match(debrief, /1969/, 'debrief names the 1969 Moon landing');
  assert.match(debrief, /tough and competent/i, 'debrief names the post-Apollo-1 creed');
  assert.match(debrief, /1970/, 'debrief names Apollo 13, 1970');
  assert.match(debrief, /aerospace|Boca Chica|commercial.space/i, 'debrief names the modern aerospace/commercial-space industry');
  assert.match(debrief, /hospital/i, 'debrief names the medical spinoff partnership');
});

test('sensitivity: no gore, no spectacle — the anomaly and blackout stay method-focused (spec §6)', () => {
  const text = allText();
  assert.doesNotMatch(text, /gore|blood|dying|death|explod/i, 'no graphic detail anywhere in the content bank');
  assert.doesNotMatch(text, /savage|primitive|heathen/i, 'no slurs, no spectacle');
});

test('the design is honest: NO early-fail, and NO scripted event tolls (spec §3, §6)', () => {
  const state = game.initMatch({ soloSide: SIDE });
  const rep = game.report(state);
  assert.equal(rep.perSide[SIDE].failed, false, 'there is no early game-over');
  const scriptedEffects = PHASES.filter((p) => p.eventEffects);
  assert.equal(scriptedEffects.length, 0, 'no phase carries a scripted meter toll — every effect comes from the player’s own call');
});

// --- Playthrough helpers (drive the adapter directly, no GameManager) --------

function playRun(pick) {
  const state = game.initMatch({ soloSide: SIDE });
  for (let step = 0; step < game.totalActions; step++) {
    game.chapterEvent(state, SIDE);            // idempotent per phase; safe each step
    const res = game.resolve(state, SIDE, pick(state));
    assert.ok(!res.error, `step ${step} failed: ${res.error}`);
  }
  return game.report(state);
}

const rightMove = (state) => game.aiMove(state, SIDE);

const moveWithVerdict = (verdict) => (state) => {
  const ss = state.sides[SIDE];
  const steps = PHASES.flatMap((p) => p.steps);
  const step = steps[ss.cursor];
  const realIdx = step.choices.findIndex((c) => c.verdict === verdict);
  return { kind: step.kind, choiceIndex: ss.shuffles[ss.cursor].indexOf(realIdx) };
};

const wrongMove = moveWithVerdict('wrong');
const partialMove = moveWithVerdict('partial');

test('all-right run: 100% accuracy and "Flight, We’re GO"', () => {
  const you = playRun(rightMove).perSide[SIDE];
  assert.equal(you.accuracy, 100);
  assert.equal(you.failed, false);
  assert.equal(you.ending.key, 'top');
  assert.equal(you.ending.title, ENDINGS.top.title);
  assert.equal(you.score, 291);
});

test('all-wrong run: 0% accuracy, a hard mission, but it still finishes (no early-fail)', () => {
  const you = playRun(wrongMove).perSide[SIDE];
  assert.equal(you.accuracy, 0, 'every wrong answer scores 0 across the full 12-action denominator');
  assert.equal(you.failed, false, 'the game never ends early — the meters just fall');
  assert.equal(you.ending.key, 'low');
  assert.equal(you.ending.title, ENDINGS.low.title);
  assert.equal(you.score, 45);
});

test('all-partial run: 50% accuracy and a mid-tier splashdown', () => {
  const you = playRun(partialMove).perSide[SIDE];
  assert.equal(you.accuracy, 50, '12 halves = 50%');
  assert.equal(you.ending.key, 'mid');
  assert.equal(you.ending.title, ENDINGS.mid.title);
  assert.equal(you.score, 165);
});

test('currentPrompt never leaks the answer key', () => {
  const state = game.initMatch({ soloSide: SIDE });
  game.chapterEvent(state, SIDE);
  const prompt = game.currentPrompt(state, SIDE);
  assert.equal(prompt.choices.length, 3);
  for (const c of prompt.choices) {
    if (typeof c === 'object') {
      assert.ok(!('verdict' in c) && !('feedback' in c) && !('effects' in c), 'no answer key on a choice');
    }
  }
});

test('mission-score tiers: Flight We’re GO >= 200, Splashdown 110–199, Long Night in the Trench < 110', () => {
  assert.equal(endingFor(300).key, 'top');
  assert.equal(endingFor(200).key, 'top');
  assert.equal(endingFor(199).key, 'mid');
  assert.equal(endingFor(110).key, 'mid');
  assert.equal(endingFor(109).key, 'low');
  assert.equal(missionScore({ mission: 50, crewSafety: 50, team: 50 }), 150);
});

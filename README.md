# Mission Control: Texas in Space

**Source:** not yet pushed to GitHub.

A solo, class-wide Texas History game for **Unit 7 — 20th and 21st Century Texas**.
Everyone in the class works the same console as a young **flight controller at NASA's Johnson Space Center**, Houston, through one full mission.

> "Houston" was the first word spoken from the Moon — and tonight, Houston is you. Take your
> console for a full mission, work the problems the way flight controllers really do, and find
> out why the road to space runs through Texas.

- **TEKS:** 7.12C (aerospace industry's impact), 7.19A/C/E (technology's effects; interdependence), 7.7E (contemporary era)
- **Shape:** 6 phases × 2 graded decisions = **12 graded actions**; three meters — 🚀 **Mission**, ❤️ **Crew Safety** (always outranks the others), 🎧 **Team** — all start at 50.
- **The honest design:** a straight choice-driven game — no early-fail, no scripted meter tolls. Students live the flight controller's method: checklists, calm call-and-response over the loop, "work the problem" instead of guessing, and crew safety above the schedule, every time. The debrief ties it to the real history: JSC (1961–63), Apollo 11 (1969), the post-Apollo-1 "tough and competent" creed, Apollo 13 (1970), the shuttle/ISS eras, and today's Houston-to-Boca-Chica commercial-space industry.
- **Sensitivity:** contemporary era, no sensitivity flags beyond the Common Standards — kept inspirational and method-true throughout.

Built on the shared Texas History game engine (Pattern A): server-authoritative Node + Express + Socket.IO, a React 18 + Vite thin client, one Render web service, and a live **Teacher Command Center** reporting one class-wide accuracy group. All session state lives in server memory — no database. See `D:\Texas History\Common_Build_Standards.md`.

## Run it locally

```bash
npm install          # cascades to server/ and client/ via postinstall (exFAT-safe, no workspaces)
npm run build        # builds the React client into client/dist
npm start            # node server/src/index.js — serves the built client + sockets on :4760
```

Then open:
- **Students:** <http://localhost:4760/>
- **Teacher Command Center:** <http://localhost:4760/#teacher> (create a session, share the 6-digit code)

For client hot-reload during development, run the server (`npm start`) and, in another terminal, `npm run dev:client` (Vite, proxying sockets to :4760).

```bash
npm test             # server test suite (content bank, balance, lifecycle, sensitivity, scoring)
```

## Deploy (Render) & embed (Wix)

- Not yet pushed to GitHub or deployed to Render.
- Render → New Blueprint Instance → connect the repo. `render.yaml` is included: `buildCommand: npm install && npm run build`, `startCommand: node server/src/index.js`. Render sets `PORT`.
- In Wix: **Add → Embed Code → Embed a Site**, paste the Render HTTPS URL (~1000×720). Put the `#teacher` route on a **password-protected** Wix page; the in-app 4-digit PIN is a second layer.

## Layout

```
server/src/games/missionControl.js  the game: 6 phases, the answer key (verdicts/effects/feedback), the debrief
server/src/games/_stepGame.js       the shared step-game factory (createStepGame)
server/src/GameManager.js           sessions, roster, class accuracy, PDF data — engine (unchanged)
client/src/components/student/       Datapad (title/how/join), MatchView, ResultScreen
client/src/components/shared/        MissionPanel (the console-status SVG scene + GO/NO-GO lights), MetersBar
client/src/components/teacher/       CommandCenter (code, approval, roster, PDF, end-session)
client/public/assets/images/         6 Higgsfield illustrations (title + 4 phases + ending, one phase art-free)
```

*Made for 7th Grade Texas History · TEKS 7.12C, 7.19A, 7.19C, 7.19E, 7.7E.*

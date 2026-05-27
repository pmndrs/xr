FROM node:22-bookworm-slim

ENV SHELL=/bin/bash

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates ffmpeg git procps ripgrep zsh \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack prepare pnpm@9.4.0 --activate \
  && npm install -g @openai/codex@0.128.0

RUN npx --yes playwright@1.59.1 install --with-deps chromium

RUN cat > /usr/local/bin/install-vitexec-skill <<'EOF' \
  && chmod +x /usr/local/bin/install-vitexec-skill
#!/usr/bin/env bash
set -euo pipefail

npx --yes skills add drawcall-ai/vitexec --yes

node --input-type=module <<'NODE'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const notes = [
  "vitexec doesn't require a running Vite server. Do not start or leave running a Vite server, including after validation.",
  "For WebXR validation, use vitexec WebXR/IWER guidance and make XR validation the passing path: install IWER at the start of the snippet, enter the app's normal XR session, grant an offered session only if no XR session is already active, wait for activeSession, and drive emulated controller/select input.",
  "Prefer direct IWER controller APIs such as controllers.right.position, controllers.right.quaternion, and updateButtonValue('trigger', ...) over remote.dispatch for this eval.",
  "Move the emulated headset/viewer through the scene before selections; the recording should show a trainee approaching or standing in front of targets, not a fixed viewer with a jumping controller.",
  "Keep the viewer transform realistic and readable: plausible standing headset height, comfortable target distance, and enough surrounding context in frame.",
  "Design generated showcase XR controls to be visually clear and easy to aim at from plausible headset/controller poses.",
  "Laptop or desktop fallback validation can be extra, but it is not sufficient proof for an XR application.",
  "Log explicit XR runtime evidence, such as milestone:xr-session with activeSession true, plus controller/select milestones.",
  "Log viewer movement evidence, such as milestone:viewer-move with station names and headset positions.",
  "Log milestone:view-check at key stations with elapsed time, viewer position, target position, distance meters, target-in-frame status, and projected screen bounds or coverage; fail if the camera is too close, clipped, or unreadable.",
  "If vitexec is wrapped in a package script, assert required XR milestone logs and fail on browser/page error log lines.",
  "Some vitexec versions can log injected-script failures while exiting 0; CI-style wrappers should inspect stdout for required milestones, browser/page errors, and missing recording or screenshot artifacts.",
  "For XR ray tests, aim at user-facing controls with clear line of sight, wait a few frames after session entry and controller pose changes, then hold trigger/select for multiple frames.",
  "With recent Three.js WebXR manager builds, IWER may need installRuntime({ globalObject: globalThis, polyfillLayers: true }) so XRWebGLBinding exists before session setup.",
  "For vanilla @pmndrs/xr ray tests, if a look-at quaternion misses, inspect the live store/input-source state and try a simple stable pose: stand directly in front of the target, place the controller in front of it, and use the controller default -Z ray.",
  "Avoid binding both pointerdown and click to the same selection mutation unless it is idempotent; controller triggers can produce both.",
  "If direct canvas pixel readback is unreliable in XR, use vitexec screenshots/recordings plus explicit XR/session/state milestones as visual evidence.",
  "In ordered spatial flows, completed or disabled panels that sit in front of later targets should stop receiving pointer/raycast hits so controller rays can reach the active target.",
  "Use dependency versions that resolve in the registry; if an assumed version fails, query available versions and pin a published one before continuing.",
  "Before driving input, wait for the page, canvas, XR store bindings, and UI controls to be mounted; fix early-input failures by waiting for readiness, not by bypassing interaction.",
  "Do not add test-only global fallbacks to satisfy automation. Drive DOM controls, pointer events, and store-backed interaction paths.",
  "For complex XR workflows, script a representative session with clear milestone logs, stable assertions, visible canvas evidence, and failure paths.",
  "After the first full validation run, keep workflow steps, assertion thresholds, and success criteria stable; fix app behavior or input timing rather than weakening the test.",
]

const webxrNotes = [
  '',
  '## Harness Notes',
  '',
  '- XR apps must prove the XR path. Desktop or laptop fallback checks can be extra, but they are not sufficient.',
  '- Install IWER at the start of the snippet before waiting for the app to settle, trigger the app normal XR entry control, grant an offered session only if no XR session is already active, wait for activeSession, and log it.',
  '- Drive input through emulated headset/controller/hand actions. Do not call app callbacks, reducers, or setters to advance milestones.',
  '- Move the emulated headset/viewer through the scene before selections so recordings show a trainee approaching or standing in front of each target.',
  '- Keep the viewer transform realistic and readable: plausible standing headset height, comfortable target distance, and enough surrounding context in frame.',
  '- Log explicit milestones such as milestone:xr-session with activeSession true, plus controller/select milestones.',
  '- Log viewer movement milestones such as milestone:viewer-move with station names and headset positions.',
  '- Log milestone:view-check at key stations with elapsed time, viewer position, target position, distance meters, target-in-frame status, and projected screen bounds or coverage; fail if the camera is too close, clipped, or unreadable.',
  '- If vitexec is wrapped in a package script, assert required XR milestone lines and fail on ^[error] or ^[page error] log lines.',
  '- Some vitexec versions can report injected snippet failures in browser logs while returning exit code 0; wrappers should inspect stdout for required milestones and errors.',
  '- Prefer direct IWER controller APIs such as controllers.right.position, controllers.right.quaternion, and updateButtonValue("trigger", ...) over remote.dispatch for this eval.',
  '- Prefer selecting clear, user-facing XR affordances with a reliable line of sight from the emulated controller.',
  '- With recent Three.js WebXR manager builds, IWER may need installRuntime({ globalObject: globalThis, polyfillLayers: true }) so XRWebGLBinding exists before session setup.',
  '- For vanilla @pmndrs/xr ray tests, if a look-at quaternion misses, inspect live store/input-source state and try a simple stable pose with the controller directly in front of the target using its default -Z ray.',
  '- Avoid binding both pointerdown and click to the same selection mutation unless it is idempotent; controller triggers can produce both.',
  '- If direct canvas pixel readback is unreliable in XR, use vitexec screenshots/recordings plus explicit XR/session/state milestones as visual evidence.',
  '- In ordered flows, make completed or disabled spatial panels stop receiving pointer/raycast hits if they sit between the user and later targets.',
  '- Before each interaction, place the headset at a plausible standing position near the target and orient it toward the station; then position the controller relative to that viewer pose.',
  '- Default to about 1.45-1.8m headset height and about 1.1-3.5m target distance in adult-scale scenes unless the task needs close inspection.',
  '- Aim at the center of the same target a headset user would select; do not advance state through private app APIs when a ray selection misses.',
  '- After entering XR or moving/aiming a controller, wait several animation frames before pressing trigger/select so ray intersections and hover state settle.',
  '- Hold trigger/select down for multiple frames; a one-frame pulse may be too short for app-level pointer/select handlers.',
].join('\n')

const skillPath = '.agents/skills/vitexec/SKILL.md'
if (existsSync(skillPath)) {
  let text = readFileSync(skillPath, 'utf8')
  if (!notes.every((note) => text.includes(note))) {
    text = text.replace(/(# vitexec\s*)/, `$1\n\n${notes.join('\n\n')}\n`)
    writeFileSync(skillPath, text)
  }
}

const webxrPath = '.agents/skills/vitexec/references/webxr.md'
if (existsSync(webxrPath)) {
  let text = readFileSync(webxrPath, 'utf8')
  if (!text.includes('## Harness Notes')) {
    text = `${text.trim()}\n${webxrNotes}`
    writeFileSync(webxrPath, text)
  }
}

const openaiPath = '.agents/skills/vitexec/agents/openai.yaml'
if (existsSync(openaiPath)) {
  let text = readFileSync(openaiPath, 'utf8')
  if (!notes.every((note) => text.includes(note))) {
    text = text.replace(/default_prompt: ['"]?/, (match) => `${match}${notes.join(' ')} `)
    writeFileSync(openaiPath, text)
  }
}
NODE
EOF

WORKDIR /workspace/app

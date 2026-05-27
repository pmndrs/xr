# Use-Case Patterns

Use the task domain to choose interaction, evidence, and UI. Do not copy these as fixed templates; treat them as pressure tests for whether the experience feels real.

## Games

- Show changing game state: score, waves/rounds, ammo/energy, accuracy, timer, health/fail state, and final result.
- Match the main input to the fantasy: weapon from a muzzle, glove/fist contact, grabbing, throwing, steering, rhythm timing, or gaze only when it is truly the mechanic.
- Validate visible play: hits, misses, motion, transitions, and end state should come from controller/headset input.

## Training

- Model an ordered task with orientation, current instruction, progress, mistakes/hazards, corrective action, and pass/fail report.
- Let the learner inspect real-feeling stations, tools, parts, or objects from plausible headset positions.
- Validate each critical step through visible spatial interaction and view checks, not by directly advancing task state.

## Simulation

- Represent the simulated system with telemetry, constraints, warning/recovery state, and visible movement over time.
- Drive the system from user input: controller pose/buttons, hand interaction, steering/throttle controls, handles, or spatial waypoints.
- Validate before/after simulated state such as position, orientation, velocity, waypoint progress, warning state, or process completion.

## Commerce And Configuration

- Make the product inspectable at useful scale with variants/materials, dimensions, fit/readiness, price or summary, and reset/confirm paths.
- For AR placement, use hit-test, planes, anchors, reticles, footprints, or equivalent surface affordances. Show placement and fit feedback in the XR scene even if handheld AR also uses DOM overlay.
- For spatial configuration, prove actual transforms or variant changes: place, drag, rotate, scale, snap, swap, and summarize the configured result.

## Professional Tools

- Prefer visible handles, gizmos, grabbable affordances, annotations, and clear selected/locked/error states.
- Keep controls dense enough for repeated work but readable in headset. Primary status and manipulation feedback should stay in-scene.
- Validate real edits with transform/state deltas and a final reviewable summary.

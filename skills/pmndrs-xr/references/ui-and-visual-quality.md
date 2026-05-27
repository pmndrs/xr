# In-Scene UI And Visual Quality

## In-Scene UI

- Immersive VR and non-handheld AR cannot rely on DOM/HTML for the primary status panel, checklist, score, report, or controls.
- Use `@react-three/uikit` for React Three Fiber panels.
- DOM buttons remain appropriate for the initial browser user gesture and optional laptop fallback.
- Do not use `@react-three/drei` `<Html>` or `XRDomOverlay` as immersive VR/non-handheld UI.
- In-scene UI should not cover the whole headset view. Keep panels compact and place them beside, above, below, or behind the active target so the central recording still shows the world, affordances, and task object.
- Camera-following HUDs are acceptable when compact. They must leave the center of the viewport open for the scene and should not become the only visible content in the recording.
- For eval-friendly uikit apps, persistent UI should stay well below roughly one third of the headset view during normal play. The harness samples uikit roots over time, so a large temporary report is fine only if the walkthrough returns to a world-visible pose afterward.
- Prefer small persistent panels over dashboard-sized panels in the forward view. For typical 500-600px wide uikit panels, use a small world scale or pixel size and place the panel laterally so the projected panel normally stays closer to 10-20% of the view, leaving headroom for temporary callouts and reports.
- Treat the whole uikit root as the measured footprint. A single wide root with several rows of controls can still fail even if individual buttons are small; split optional controls into smaller roots or compress status text when the world object must remain visible.
- Prefer sizing uikit roots with `pixelSize` on the `Container`. Avoid shrinking a parent group and also using tiny uikit layout units, because double scaling can make the panel technically present but unreadable in the headset recording.
- Treat camera orientation as part of visual quality. After interacting with a panel, handle, or product control, turn or move back so the next recorded seconds frame the active world object and not an empty wall, blank AR background, or white page area.

## Package Notes

- React uikit companion packages are commonly `@react-three/uikit`, `@react-three/uikit-default`, and `@react-three/uikit-lucide`.
- During eval work, `1.0.67` was observed as a published version for those uikit packages.

## Visual Quality

- Build a domain-specific scene, not a placeholder-cube demo.
- Include recognizable environment context: floor, walls, lanes, studio, warehouse, showroom, range, workstation, or similar.
- Use multiple object types and readable scale cues.
- Add lighting and material variation.
- Make interactive affordances obvious from plausible headset/controller poses.
- Keep the primary game/training/tool object visible while UI is displayed. If the user looks at a menu or report, return the viewer to the active world object or frame both the panel and object before continuing.
- Prefer plain 6-digit color hex plus explicit opacity/alpha props for Three/uikit colors. Some Three color paths warn on 8-digit CSS hex such as `#111820ee`.
- Show feedback for hover, selection, hit, miss, completion, errors, score changes, wave changes, or configuration changes.
- In games, show motion, progression, score, failure states, and final results.
- In tools/training apps, show task state, current target, completion criteria, and final report/summary.
- In simulations, show telemetry, constraints, warnings, recovery, and mission/process outcome.
- In commerce/configuration, show selected product or part, variants/materials, dimensions/fit, price/readiness, and final configuration/cart summary.

## Common Pitfalls

- UI text exists only in DOM while the headset sees empty 3D space.
- A large uikit panel or HUD fills the entire recorded viewport, hiding pads, products, handles, robots, or vehicles.
- The viewer turns toward an empty white, grey, or transparent AR background after a successful action, so the video proves logs but not the experience.
- Controls are hidden behind walls, rails, old panels, or decorative meshes.
- Targets are too tiny, too close, or lack active hit geometry.
- Repeated cards/panels look polished on desktop but are unreachable by XR rays.

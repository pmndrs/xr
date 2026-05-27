#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const COMMON_BUILDER_REQUIREMENTS = `Also include an automated XR walkthrough at ./vitexec/play.ts that proves the main flow works inside an emulated headset session. Use vitexec with IWER/WebXR: install the emulated runtime at the start of the snippet, enter the app's normal XR session path, grant the offered session only if no XR session is already active, wait for an active session, move the emulated headset/viewer to stand in front of each station or task area, move and orient the emulated controller/hand according to the use case, press/select like a headset user, and log proof that the XR session is active. For near interactions such as boxing, move the glove/fist/controller into the pad contact volume. For shooting, align the visible gun/blaster muzzle with the target and fire from that muzzle. Prefer the direct IWER headset/controller APIs, such as position, quaternion, and updateButtonValue("trigger", ...), over the remote dispatch API. A laptop walkthrough can be extra, but it must not be the proof that passes this test.

For immersive VR or non-handheld AR, the checklist, status panel, task prompts, report, and controls must exist inside the WebXR scene, not only as HTML/DOM. Use @react-three/uikit for panel-style UI. DOM buttons are allowed for the initial browser session-entry gesture and optional laptop fallback, but @react-three/drei <Html>, XRDomOverlay, or ordinary DOM panels are not acceptable as the primary in-headset UI for this eval.

Choose an input metaphor that matches the use case instead of defaulting to generic controller laser pointers. A UI panel can use ray/pointer selection. A boxing trainer should use hand/controller pose, glove/fist models, reach/contact volumes, or near-interaction collisions. A shooting game should attach a visible blaster/gun/tool to the controller and raycast/project from its muzzle, with recoil/tracer/projectile feedback; the visible affordance should be the weapon, not only a floating pointer line.

For editor, configurator, assembly, layout, or robot-teaching tasks, demonstrate real manipulation rather than only buttons: use documented @react-three/handle components where appropriate, expose visible handles/gizmos or grabbable affordances, drag/translate at least one object, rotate at least one object through pointing or a rotation handle, and validate those changes by comparing object transforms before and after controller input.

For AR placement, e-commerce, room planning, or merchandising tasks, demonstrate real spatial placement rather than only changing a preview mesh: enter AR, use hit-test/planes/anchors or a clear emulated equivalent, place at least one item on a surface, rotate or scale it spatially, switch a variant/material, and validate placement transforms before and after controller or touch/XR input.

For simulation tasks, demonstrate the simulated system changing over time under user input: show telemetry/status in the scene, drive a vehicle/tool/process from controller or spatial input, pass through waypoints or complete checkpoints, handle at least one warning/failure/recovery condition, and validate the simulated state from visible motion rather than setting state directly.

Make the experience visually credible for its domain. Avoid placeholder-cube demos. Build a scene with recognizable environment context, at least three distinct interactive objects or targets, lighting/material variation, clear spatial affordances, and visible feedback for hover/selection/hit/success/failure. The recording should show the experience changing over time, not only static state counters.

Keep in-scene UI readable but spatially modest. Panels, HUDs, and cards must not cover the whole recorded view or hide the primary game/training/tool world. Place status UI to the side, above, below, or in a compact camera-following HUD that leaves the central target and surrounding environment visible. If a UI panel is the current interaction target, show it briefly and then move/turn back to the world or task object.

When using React Three Fiber uikit, include the needed published packages such as @react-three/uikit, @react-three/uikit-default, and @react-three/uikit-lucide. Query the registry if unsure; recent eval runs observed version 1.0.67 for all three packages.

Keep the React Three package set internally compatible. If you use current @react-three/drei 10.x, pair it with React/React DOM 19.x and @react-three/fiber 9.x; do not mix drei 10 with fiber 8 or React 18. If drei is not needed, omit it rather than adding a package that can create peer-dependency conflicts.

Use a published IWER package for the vitexec walkthrough; current registry checks show iwer 2.2.1 is available, while iwer 1.9.x is not.

Use the bundled skill references and npm registry checks for API/package details. Do not browse the web for UI docs during the eval run.

The walkthrough should capture visual evidence, log each milestone, and fail if any required step is skipped, if browser/page errors are logged, if the session never enters XR, if the viewer stays fixed while only the controller moves, if the video is mostly blank/white, or if the UI covers the world for most of the run. Pace the walkthrough so the recording clearly shows the user walking/turning between stations and each major stage; the captured walkthrough should last at least 20 seconds.

The XR viewer transform must be realistic and readable in the recording. At each major station or task area, stand at a plausible human headset height, usually about 1.45-1.8m, and keep the target at a comfortable inspection distance, usually about 1.1-3.5m rather than pressing the camera against the object. Log a milestone:view-check JSON object for at least three checkpoints. Each view-check should include the station name, elapsed milliseconds, viewer position, target position, distance in meters, whether the target is in frame, and projected screen bounds or center/size. Assert those checks before selecting. Use checkpoint screenshots when practical, or record video and keep enough timing data for the eval harness to extract frames at those view-check moments.

Expose a read-only R3F devtools global for eval-time scene audits: window.__pmndrsXrEval = { scene, camera, gl } from a tiny component using useThree(). Do not expose workflow mutators through this object. The harness uses it to measure uikit panel coverage in the headset view.

Create and edit code files with patch/file-edit operations rather than shell heredocs, because JSX, HTML, and template strings are easy to corrupt through shell quoting. Shell heredocs such as cat <<EOF, cat > file <<EOF, or tee <<EOF are forbidden in this eval.`
  + `\n\nThis is an execution task, not a planning task. If the workspace is empty, create a minimal runnable vertical slice first: package scripts, src/main, src/App, styles, and vitexec/play. Read only the specific bundled references needed for the immediate API decision, avoid broad source archaeology in node_modules, and prefer simple direct geometry/input over pausing to design the whole app. Once the vertical slice builds, iterate it toward the requested domain richness and walkthrough proof. Do not stop after a checklist or plan. When the build and walkthrough pass, stop and summarize the result. Do not start a live preview or development server.`

const EVAL_CASES = {
  'warehouse-training': `Use $pmndrs-xr to make me an immersive warehouse safety trainer for new staff.

I want to walk through an emergency equipment inspection as if I am on the warehouse floor. It should feel like a practical training tool, not a toy demo:
- Give me a clear control panel with start buttons, the current task, checklist progress, risk score, and final pass/fail report.
- Render the checklist/status/report panel as in-scene XR UI, preferably with @react-three/uikit; a DOM overlay or laptop-only panel is not enough.
- Put at least three recognizable stations in the space, such as a fire extinguisher, eyewash station, electrical panel, and exit route markers.
- Guide me through ordered steps: get oriented, inspect the equipment, find one safety hazard, perform a corrective action, confirm the checklist, and review the report.
- Make selecting and inspecting stations feel spatial, with obvious hover/selection/completion feedback.
- Make it usable on a normal laptop too, so I can review the full training flow without a headset.

${COMMON_BUILDER_REQUIREMENTS}`,

  'arcade-shooter': `Use $pmndrs-xr to make me a polished VR arcade shooting gallery.

This should feel like a real small game, not a tech demo:
- Build a themed range with depth, lighting, lane boundaries, target rails, and moving or timed targets.
- Use at least three target types with different motion, score, or hit behavior.
- Include in-scene XR UI for score, wave, timer, ammo/reload or heat, accuracy, and final result.
- Attach a visible arcade blaster/gun model to the controller and shoot from its muzzle. Use trigger input to fire, raycast/project from the muzzle, and show tracer/projectile/recoil feedback. Do not make the primary shooting affordance a generic controller laser pointer.
- Add satisfying visual feedback: hit bursts, target state changes, missed-shot feedback, wave transitions, and final score presentation.
- Keep targets non-human and arcade-like.

${COMMON_BUILDER_REQUIREMENTS}`,

  'fitness-reaction': `Use $pmndrs-xr to make me a VR reaction and boxing-pad trainer.

This should feel like a plausible training app:
- Build a small gym/studio space with pads, timing lights, round timer, combo prompts, accuracy, streak, and final grade.
- Spawn at least three pad positions or target patterns at different heights and lateral positions.
- Use punch-like near interaction: represent hands/controllers as gloves or fists, move them to the pad, and count hits through proximity/contact volumes or short-range collision checks. Do not use a long controller pointer/ray as the main punching mechanic.
- Render round status, combo, score, misses, and final results as in-scene XR UI.
- Show good visual feedback: pad flashes, combo progress, miss/late feedback, rhythm pacing, and end-of-round summary.
- Keep the laptop fallback as a review mode; the passing proof must be emulated XR input.

${COMMON_BUILDER_REQUIREMENTS}`,

  'product-configurator': `Use $pmndrs-xr to make me an XR product configurator for a modular workstation.

This should feel like a real showroom/sales tool:
- Build a recognizable workstation or kiosk with at least three configurable modules, such as monitor arm, shelf, tool rail, lighting, or color/material swatches.
- Let the user select modules, drag/translate one module, rotate another module through pointing or a rotation handle, snap at least one module to a valid mount, and switch variants/materials.
- Use @react-three/handle documented components where object manipulation is appropriate. The walkthrough should visibly exercise TransformHandles/PivotHandles/HandleTarget-style behavior, not only click UI buttons.
- Include in-scene XR UI for selected part, transform mode, dimensions/fit warnings, price or readiness, reset, and final configuration summary.
- Make the configured object visually inspectable from plausible headset positions with clear before/after feedback.
- Desktop fallback can support review, but the passing proof must use emulated XR controller input.

${COMMON_BUILDER_REQUIREMENTS}`,

  'robot-arm-teach': `Use $pmndrs-xr to make me an XR robot-arm teach pendant for a small industrial cell.

This should feel like a practical spatial programming tool:
- Build a recognizable robot cell with a robot arm, work table, safety cage, tool head, and at least four editable path waypoints.
- Use documented @react-three/handle components for waypoint/object editing where appropriate.
- Let the user select a waypoint, drag/translate it to a new reachable location, rotate the tool orientation through pointing or a rotation handle, and snap/confirm the updated path.
- Show visible transform handles/gizmos, reach/safety warnings, path preview lines, selected waypoint state, and final program summary as in-scene XR UI.
- The passing XR walkthrough must prove object transforms changed from controller input, including before/after logs for drag and rotate operations.

${COMMON_BUILDER_REQUIREMENTS}`,

  'assembly-bench': `Use $pmndrs-xr to make me an XR assembly bench for configuring a small sensor rig.

This should feel like a hands-on assembly and inspection tool:
- Build a bench with a base rail, bracket, sensor head, cable clip, fastener, and alignment guide.
- Use spatial manipulation: grab or drag the bracket into place, rotate the sensor head with a visible handle/gizmo, snap one part to the rail, and confirm alignment.
- Use @react-three/handle components for transform/rotation affordances where useful, plus clear grabbable geometry for direct controller interaction.
- Include in-scene XR UI for selected part, current operation, tolerance/alignment, missing steps, and final build readiness.
- The passing XR walkthrough must show a controller-driven drag/grab, a controller-driven rotate, a snap/alignment result, and before/after transform assertions.

${COMMON_BUILDER_REQUIREMENTS}`,

  'ar-furniture-commerce': `Use $pmndrs-xr to make me a handheld AR furniture commerce and room-planning tool.

This should feel like a real customer-facing sales experience:
- Let the shopper enter AR, scan or use a floor/table surface, and place a sofa, side table, lamp, or similar product into the room.
- Include at least three purchasable/configurable product modules or variants with readable materials, dimensions, price/readiness, and a cart or saved configuration summary.
- Let the user spatially place one item, rotate or scale it, switch material/variant swatches, and confirm whether the object fits the room footprint.
- Use hit-test, planes, anchors, or a clear emulated AR placement equivalent for the passing walkthrough. A static VR showroom is not enough for this case.
- For handheld AR, a DOM overlay can supplement the experience, but core product placement feedback, fit footprint, and selected item state must be visible in the XR scene.
- The passing XR walkthrough must prove placement, rotate/scale or material change, and final configuration with before/after transform or variant logs.

${COMMON_BUILDER_REQUIREMENTS}`,

  'drone-flight-sim': `Use $pmndrs-xr to make me an XR drone inspection flight simulator.

This should feel like a practical simulation/training app:
- Build an indoor industrial inspection bay, warehouse aisle, or wind-tunnel course with a drone, gates/checkpoints, hazards, target inspection points, and landing zone.
- Let the user pilot or guide the drone with controller input, pass through at least three waypoints, inspect one target, handle one warning such as low battery, crosswind, proximity, or collision risk, and land or complete the route.
- Include in-scene XR UI for telemetry such as speed, altitude, battery, route progress, warning state, mission timer, and final pass/fail report.
- Show visible simulated motion and feedback: drone orientation, prop/engine cues, gate pass feedback, warning/recovery feedback, and route completion.
- Make the laptop fallback useful for review, but the passing proof must use emulated XR/controller input to change the drone or route state.
- The passing XR walkthrough must log controller input, drone motion before/after, at least three waypoint/view-check milestones, a warning or recovery event, and a final mission result.

${COMMON_BUILDER_REQUIREMENTS}`,
}

const DEFAULT_EVAL_CASE = 'warehouse-training'

const IMAGE = process.env.EVAL_DOCKER_IMAGE ?? 'pmndrs-xr-eval-codex:0.128.0-node22-vitexec-skill'
const DOCKERFILE = 'scripts/eval-pmndrs-xr.Dockerfile'
const CONTAINER_WORKSPACE = '/workspace'
const CONTAINER_APP = `${CONTAINER_WORKSPACE}/app`
const DEFAULT_RECORD_WIDTH = 1280
const DEFAULT_RECORD_HEIGHT = 720
const DEFAULT_UI_COVERAGE_THRESHOLD = 0.3
const DEFAULT_UI_COVERAGE_TIME_RATIO = 0.4

async function main() {
  const repoCwd = process.cwd()
  if (process.env.EVAL_ANALYZE_VIDEO != null) {
    const videoPath = path.resolve(process.env.EVAL_ANALYZE_VIDEO)
    const runDir = process.env.EVAL_ANALYZE_RUN_DIR ?? path.dirname(videoPath)
    const duration = await getVideoDurationSeconds(videoPath)
    const issue = await getVideoVisualEvidenceIssue(videoPath, runDir, duration)
    console.log(JSON.stringify({ videoPath, duration, issue }, null, 2))
    if (issue != null) process.exitCode = 1
    return
  }
  if (process.env.EVAL_ANALYZE_APP_DIR != null) {
    const appDir = path.resolve(process.env.EVAL_ANALYZE_APP_DIR)
    const caseName = process.env.EVAL_CASE ?? DEFAULT_EVAL_CASE
    const issues = await getGeneratedQualityIssues(appDir, caseName)
    console.log(JSON.stringify({ appDir, caseName, issues }, null, 2))
    if (issues.length > 0) process.exitCode = 1
    return
  }
  const selectedCase = selectEvalCase()
  if (process.env.EVAL_DRY_RUN === '1') {
    if (!(await isFile(path.join(repoCwd, 'skills', 'pmndrs-xr', 'SKILL.md')))) {
      throw new Error('Missing skills/pmndrs-xr/SKILL.md')
    }
    console.log(`[pmndrs-xr-eval] Dry run case: ${selectedCase.name}`)
    console.log(`[pmndrs-xr-eval] Available cases: ${Object.keys(EVAL_CASES).join(', ')}`)
    console.log(`[pmndrs-xr-eval] Dry run prompt:\n${selectedCase.prompt}`)
    return
  }
  const keepRun = process.env.EVAL_KEEP === '1'
  const runRoot = process.env.EVAL_RUN_ROOT ?? path.join(repoCwd, 'artifacts', 'pmndrs-xr-eval')
  const runDir = path.join(
    runRoot,
    `pmndrs-xr-eval-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const appDir = path.join(runDir, 'app')
  const videoPath = path.join(runDir, 'play.webm')
  let browserServer

  try {
    log(`run: ${runDir}`)
    await ensureDockerImage(repoCwd)
    await prepareWorkspace(repoCwd, appDir)
    if (process.env.EVAL_REUSE_APP_DIR != null) {
      log(`builder: reuse app ${process.env.EVAL_REUSE_APP_DIR}`)
      await copyReusableApp(process.env.EVAL_REUSE_APP_DIR, appDir)
      await removeGeneratedMediaArtifacts(appDir)
      await prepareWorkspace(repoCwd, appDir)
    }
    const codexHomeDir = await prepareCodexHome(runDir)

    const useRemoteBrowser = process.env.EVAL_REMOTE_BROWSER === '1'
    const browser = useRemoteBrowser ? await startPlaywrightServer(repoCwd) : undefined
    browserServer = browser?.server
    const runtime = {
      repoCwd,
      runDir,
      appDir,
      codexHomeDir,
      browserWsEndpoint: browser?.dockerWsEndpoint,
      browserExposeNetwork: process.env.VITEXEC_BROWSER_EXPOSE_NETWORK ?? '<loopback>',
    }

    log('setup: vitexec skill')
    const skillInstall = await dockerExec(runtime, ['install-vitexec-skill'], {
      workdir: CONTAINER_APP,
      timeoutMs: 2 * 60_000,
    })
    if (skillInstall.exitCode !== 0) {
      return stopWithIssue(`vitexec skill install failed.\n${truncate(skillInstall.stderr || skillInstall.stdout, 3000)}`)
    }

    const builder = process.env.EVAL_REUSE_APP_DIR == null
      ? await runBuilder(runtime, selectedCase.prompt)
      : {
          exitCode: 0,
          history: 'Reused generated app. The app has already been copied into the current workspace at /workspace/app; inspect /workspace/app, not the original host path.',
        }
    if (builder.exitCode !== 0) return stopWithIssue(`Builder failed.\n${truncate(builder.history, 3000)}`)
    if (process.env.EVAL_REUSE_APP_DIR == null) log('builder: done')

    const scaffoldIssue = await getGeneratedScaffoldIssue(appDir)
    if (scaffoldIssue != null) return stopWithIssue(scaffoldIssue)

    const qualityIssues = await getGeneratedQualityIssues(appDir, selectedCase.name)
    if (qualityIssues.length > 0) {
      return stopWithIssue(`Generated XR experience quality gate failed.\n${qualityIssues.join('\n')}`)
    }

    log('dependencies: install')
    const dependencyInstall = await dockerExec(runtime, ['npm', 'install'], {
      workdir: CONTAINER_APP,
      timeoutMs: Number(process.env.EVAL_INSTALL_TIMEOUT_MS ?? 10 * 60_000),
    })
    await writeRunFile(runDir, 'npm-install-stdout.txt', dependencyInstall.stdout)
    await writeRunFile(runDir, 'npm-install-stderr.txt', dependencyInstall.stderr)
    if (dependencyInstall.exitCode !== 0) {
      return stopWithIssue(
        `npm install failed with exit code ${dependencyInstall.exitCode}.\nstdout:\n${truncate(dependencyInstall.stdout, 2500)}\nstderr:\n${truncate(dependencyInstall.stderr, 2500)}`,
      )
    }

    const projectBuildScript = await getProjectScript(appDir, ['build'])
    if (projectBuildScript != null) {
      log(`build: npm run ${projectBuildScript}`)
      const build = await dockerExec(runtime, ['npm', 'run', projectBuildScript], {
        workdir: CONTAINER_APP,
        timeoutMs: Number(process.env.EVAL_BUILD_TIMEOUT_MS ?? 8 * 60_000),
      })
      await writeRunFile(runDir, 'npm-build-stdout.txt', build.stdout)
      await writeRunFile(runDir, 'npm-build-stderr.txt', build.stderr)
      if (build.exitCode !== 0) {
        return stopWithIssue(
          `npm run ${projectBuildScript} failed with exit code ${build.exitCode}.\nstdout:\n${truncate(build.stdout, 2500)}\nstderr:\n${truncate(build.stderr, 2500)}`,
        )
      }
    }

    const review = await runAgentReview(runtime, builder.history)
    log('agent review: done')

    const playScriptPath = path.join(appDir, 'vitexec', 'play.ts')
    if (!(await isFile(playScriptPath))) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue('Missing ./vitexec/play.ts after builder finished.')
    }

    if (!(await isFile(path.join(appDir, 'node_modules', '.bin', 'vitexec')))) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue('Missing local vitexec CLI after builder finished.')
    }

    log('recording: start')
    const projectWalkthroughScript = await getProjectWalkthroughScript(appDir)
    const vitexecResult = projectWalkthroughScript != null
      ? await dockerExec(runtime, ['npm', 'run', projectWalkthroughScript], { workdir: CONTAINER_APP, timeoutMs: 8 * 60_000 })
      : await dockerExec(
          runtime,
          ['node_modules/.bin/vitexec', '--gpu', '--record', toContainerPath(runtime, videoPath), toContainerPath(runtime, playScriptPath)],
          { workdir: CONTAINER_APP, timeoutMs: 8 * 60_000 },
        )
    await writeRunFile(runDir, 'vitexec-stdout.txt', vitexecResult.stdout)
    await writeRunFile(runDir, 'vitexec-stderr.txt', vitexecResult.stderr)

    if (vitexecResult.exitCode !== 0) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(
        `vitexec failed with exit code ${vitexecResult.exitCode}.\nstdout:\n${truncate(vitexecResult.stdout, 3000)}\nstderr:\n${truncate(vitexecResult.stderr, 3000)}`,
      )
    }

    const logIssue = getVitexecLogIssue(vitexecResult)
    if (logIssue != null) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`vitexec reported browser errors.\n${logIssue}`)
    }

    const xrRuntimeIssue = getVitexecXrRuntimeIssue(vitexecResult)
    if (xrRuntimeIssue != null) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`vitexec did not prove an active emulated XR session.\n${xrRuntimeIssue}`)
    }

    const viewCompositionIssue = getVitexecViewCompositionIssue(vitexecResult)
    if (viewCompositionIssue != null) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`vitexec did not prove readable, realistic XR camera composition.\n${viewCompositionIssue}`)
    }

    const uiCoverageIssue = await getUikitCoverageIssue(runtime, appDir, runDir)
    if (uiCoverageIssue != null) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`Uikit UI occupies too much of the headset view.\n${uiCoverageIssue}`)
    }

    if (projectWalkthroughScript != null && !(await isNonEmptyFile(videoPath))) {
      const projectVideo = await findLatestWebm(appDir)
      if (projectVideo != null) await cp(projectVideo, videoPath)
    }

    if (!(await isNonEmptyFile(videoPath))) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`vitexec did not create a non-empty video at ${videoPath}`)
    }

    const duration = await getVideoDurationSeconds(videoPath)
    const minVideoSeconds = Number(process.env.EVAL_MIN_VIDEO_SECONDS ?? 18)
    if (duration != null && duration <= minVideoSeconds) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`Recorded workflow is too short: ${duration.toFixed(2)}s`)
    }

    await extractViewCheckFrames(videoPath, runDir, vitexecResult, duration)
    const visualIssue = await getVideoVisualEvidenceIssue(videoPath, runDir, duration)
    if (visualIssue != null) {
      console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
      return stopWithIssue(`Recorded XR video does not show usable visual evidence.\n${visualIssue}`)
    }

    const reviewIssue = getAgentReviewIssue(review)
    if (reviewIssue != null) return stopWithIssue(`Agent review flagged a quality issue.\n${reviewIssue}`)

    log(`success: ${videoPath}${duration == null ? '' : ` (${duration.toFixed(2)}s)`}`)
    console.log(`[pmndrs-xr-eval] Agent review: ${review}`)
  } catch (error) {
    return stopWithIssue(error instanceof Error ? (error.stack ?? error.message) : String(error))
  } finally {
    await browserServer?.close()
    if (keepRun) {
      log(`Kept run directory: ${runDir}`)
    } else {
      await rm(runDir, { recursive: true, force: true })
    }
  }
}

async function prepareWorkspace(repoCwd, appDir) {
  await mkdir(path.join(appDir, '.agents', 'skills'), { recursive: true })
  await cp(path.join(repoCwd, 'skills', 'pmndrs-xr'), path.join(appDir, '.agents', 'skills', 'pmndrs-xr'), {
    recursive: true,
  })
}

async function copyReusableApp(sourceDir, appDir) {
  await rm(appDir, { recursive: true, force: true })
  await mkdir(appDir, { recursive: true })
  const sourceRoot = path.resolve(sourceDir)
  await cp(sourceRoot, appDir, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(sourceRoot, source)
      if (relative === '') return true
      if (/^vitexec[/\\]__eval-/.test(relative)) return false
      if (/\.(?:webm|mp4|mov|png|jpe?g|rgb)$/i.test(relative)) return false
      return !relative.split(path.sep).some((part) => part === 'node_modules' || part === 'dist' || part === 'build')
    },
  })
}

async function removeGeneratedMediaArtifacts(appDir) {
  const files = await listAllFiles(appDir)
  await Promise.all(
    files
      .filter((file) => /\.(?:webm|mp4|mov|png|jpe?g|rgb)$/i.test(file))
      .map((file) => rm(file, { force: true })),
  )
}

async function listAllFiles(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(root, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
            return []
          }
          return await listAllFiles(entryPath)
        }
        if (entry.isFile()) return [entryPath]
        return []
      }),
    )
    return files.flat()
  } catch {
    return []
  }
}

async function runBuilder(runtime, prompt) {
  log('builder: start')
  return await runCodexExec(runtime, {
    label: 'builder',
    prompt,
    outputPath: path.join(runtime.runDir, 'builder-output.txt'),
    jsonlPath: path.join(runtime.runDir, 'builder-history.jsonl'),
    historyPath: path.join(runtime.runDir, 'builder-history.txt'),
    stderrPath: path.join(runtime.runDir, 'builder-stderr.txt'),
    timeoutMs: Number(process.env.EVAL_AGENT_TIMEOUT_MS ?? 45 * 60_000),
    idleTimeoutMs: Number(process.env.EVAL_AGENT_IDLE_TIMEOUT_MS ?? 15 * 60_000),
  })
}

function selectEvalCase() {
  if (process.env.EVAL_BUILDER_PROMPT != null) {
    return { name: 'custom', prompt: process.env.EVAL_BUILDER_PROMPT }
  }
  const name = process.env.EVAL_CASE ?? DEFAULT_EVAL_CASE
  const prompt = EVAL_CASES[name]
  if (prompt == null) {
    throw new Error(`Unknown EVAL_CASE "${name}". Available cases: ${Object.keys(EVAL_CASES).join(', ')}`)
  }
  return { name, prompt }
}

async function getGeneratedQualityIssues(appDir, caseName) {
  const issues = []
  const sourceText = await readGeneratedTreeText(appDir)
  const authoredSourceText = await readGeneratedTreeText(path.join(appDir, 'src'))
  const packageDependencyIssue = await getPackageDependencyIssue(appDir)
  if (packageDependencyIssue != null) issues.push(packageDependencyIssue)

  const usesReactXr = /@react-three\/xr\b|<\s*Canvas\b|<\s*XR\b/.test(sourceText)

  if (!/\bcreateXRStore\b/.test(sourceText)) issues.push('- Missing `createXRStore` usage.')
  if (!usesReactXr) issues.push('- Missing obvious React Three XR architecture.')
  if (usesReactXr && !/<XR\b[\s\S]{0,500}\bstore=/.test(sourceText)) {
    issues.push('- React XR app is missing `<XR store={...}>` provider usage.')
  }
  if (!/\.\s*enter(?:AR|VR|XR)\s*\(/.test(sourceText)) {
    issues.push('- Missing user-facing AR/VR/XR session entry through the XR store.')
  }
  const deprecatedApiPattern =
    /<\s*(?:XRButton|ARButton|VRButton|Interactive|RayGrab|Controllers|Hands)\b|\bimport\s+\{[^}]*\b(?:XRButton|ARButton|VRButton|Interactive|RayGrab|Controllers|Hands)\b[^}]*\}/
  if (deprecatedApiPattern.test(sourceText)) {
    issues.push('- Uses deprecated or v5-style compatibility APIs for new XR work.')
  }
  const hasReactPointerHandlers = /\bon(?:Pointer|Click|DoubleClick|ContextMenu)\w*=/.test(sourceText)
  const hasXrInputSourceEvent =
    /\buseXRInputSourceEvent\s*\([\s\S]{0,220}['"](?:select|squeeze)(?:start|end)?['"]/i.test(sourceText)
  const hasXrControllerButtonEvent =
    /\buseXRControllerButtonEvent\s*\([\s\S]{0,260}['"](?:xr-standard-trigger|trigger|xr-standard-squeeze|squeeze)['"]/i.test(
      sourceText,
    )
  const hasDirectGamepadButtonBridge =
    /\binputSource\s*\.\s*gamepad\s*\?\.\s*buttons\b/i.test(sourceText) &&
    /\b(?:pressed|trigger|value)\b[\s\S]{0,320}\b(?:intersectObjects|activeRef|xrAction|userData)\b/i.test(sourceText) &&
    /\b(?:pressed|trigger)\b[\s\S]{0,500}\b(?:activeRef|endInteraction|release|snap|selected|operation)\b/i.test(
      sourceText,
    )
  const hasSelectBridge =
    hasXrInputSourceEvent ||
    hasXrControllerButtonEvent ||
    hasDirectGamepadButtonBridge ||
    /\.\s*addEventListener\s*\(\s*['"](?:select|squeeze)(?:start|end)?['"]/i.test(sourceText)
  if (!hasReactPointerHandlers && !hasSelectBridge) {
    issues.push('- Missing normal pointer/click/select interaction handlers for XR-ready interaction.')
  }
  const hasReliableTriggerHandlers =
    /\bonPointer(?:Down|Up)\w*=/.test(sourceText) ||
    /\buseXRInputSourceEvent\s*\([\s\S]{0,220}['"]select(?:start|end)?['"]/i.test(sourceText) ||
    hasXrControllerButtonEvent ||
    hasDirectGamepadButtonBridge ||
    /\.\s*addEventListener\s*\(\s*['"]select(?:start|end)?['"]/i.test(sourceText)
  if (!hasReliableTriggerHandlers) {
    issues.push('- Missing `onPointerDown`/`onPointerUp` or equivalent select handlers for reliable XR trigger selection.')
  }

  const workflowPattern =
    /\b(checklist|inspection|hazard|report|progress|task|step|station|risk|complete|score|wave|target|ammo|reload|accuracy|combo|round|hit|miss|module|config|variant|price|grade|result|robot|waypoint|path|teach|program|assembly|bench|bracket|sensor|alignment|snap|transform|room|furniture|product|cart|fit|footprint|place|placement|anchor|plane|surface|drone|flight|pilot|telemetry|altitude|battery|gate|checkpoint|warning|collision|landing|simulation)\b/i
  if (!workflowPattern.test(sourceText)) {
    issues.push('- Source does not obviously implement the requested interactive workflow or game loop.')
  }

  const visualPattern = /\b(canvas|mesh|boxGeometry|sphereGeometry|cylinderGeometry|planeGeometry|torusGeometry|ambientLight|directionalLight|pointLight|spotLight|MeshStandardMaterial|@react-three\/uikit)\b/
  if (!visualPattern.test(sourceText)) issues.push('- Source lacks obvious visible 3D scene content.')

  const playText = await readOptionalText(path.join(appDir, 'vitexec', 'play.ts'))

  const outputQualityIssue = getOutputQualityIssue(sourceText)
  if (outputQualityIssue != null) issues.push(outputQualityIssue)

  const caseSpecificIssue = getCaseSpecificGeneratedQualityIssue(caseName, sourceText, playText)
  if (caseSpecificIssue != null) issues.push(caseSpecificIssue)

  const immersiveUiIssue = getImmersiveUiQualityIssue(caseName, sourceText, playText)
  if (immersiveUiIssue != null) issues.push(immersiveUiIssue)

  if (!/\b(screenshot|record|canvas|pixel|milestone|step|report|expect|throw new Error)\b/i.test(playText)) {
    issues.push('- vitexec script does not obviously validate milestones with visual evidence and hard failures.')
  }
  if (/@react-three\/uikit\b|@pmndrs\/uikit\b/.test(sourceText) && !/__pmndrsXrEval\b/.test(authoredSourceText)) {
    issues.push('- Missing read-only `window.__pmndrsXrEval = { scene, camera, gl }` devtools global for scene/UI coverage audits.')
  }
  if (hasVitexecAppStateBypass(playText)) {
    issues.push('- vitexec script appears to call app workflow helpers to advance state; the passing proof must use XR/controller input, not app-state bypasses.')
  }
  if (!/\bmilestone:view-check\b/i.test(playText) && !/\b(?:logMilestone|milestone)\s*\(\s*['"]view-check/i.test(playText)) {
    issues.push('- vitexec script does not log `milestone:view-check` camera-composition checkpoints.')
  }
  if (!/\b(distanceMeters|distance|targetInFrame|inFrame|projected|screen|bounds|viewerPosition|targetPosition)\b/i.test(playText)) {
    issues.push('- vitexec script does not obviously assert readable viewer/target distance and screen-space composition.')
  }
  if (!/\bfrom\s+['"]iwer['"]|\brequire\(['"]iwer['"]\)/.test(playText)) {
    issues.push('- vitexec script does not import IWER for emulated WebXR validation.')
  }
  if (!/\bXRDevice\b/.test(playText) || !/\binstallRuntime\s*\(/.test(playText)) {
    issues.push('- vitexec script does not install an emulated XR runtime.')
  }
  if (!/\bgrantOfferedSession\s*\(/.test(playText) || !/\bactiveSession\b/.test(playText)) {
    issues.push('- vitexec script does not handle offered sessions and assert an active XR session.')
  }
  if (/\bremote\s*\.\s*dispatch\s*\(/.test(playText)) {
    issues.push('- vitexec script uses IWER remote dispatch; use direct controller pose and `updateButtonValue("trigger", ...)` for this eval.')
  }
  if (!/\bcontrollers?\b/i.test(playText) || !/\bupdateButtonValue\s*\(\s*['"]trigger['"]/i.test(playText)) {
    issues.push('- vitexec script does not drive emulated controller trigger input through `updateButtonValue("trigger", ...)`.')
  }
  const setsControllerPosition =
    /\b\w+\s*\.\s*position\s*\.\s*(?:set|copy)\s*\(/.test(playText) ||
    /\b(?:set|copy)\w*(?:Vec|Vector)\w*\s*\(\s*\w+\s*\.\s*position\b/i.test(playText)
  const setsControllerQuaternion =
    /\b\w+\s*\.\s*quaternion\s*\.\s*(?:set|copy)\s*\(/.test(playText) ||
    /\b(?:set|copy)\w*(?:Quat|Quaternion)\w*\s*\(\s*\w+\s*\.\s*quaternion\b/i.test(playText)
  if (!/\bcontrollers?\b/i.test(playText) || !setsControllerPosition || !setsControllerQuaternion) {
    issues.push('- vitexec script does not set emulated controller pose for XR selection.')
  }
  const setsViewerPosition =
    /\b(?:xrDevice|device|headset|viewer)\s*\.\s*position\s*\.\s*(?:set|copy)\s*\(/.test(playText) ||
    (/\b(?:set|apply|move)\w*Pose\s*\(\s*(?:xrDevice|device|headset|viewer)\b/i.test(playText) &&
      /\b\w+\s*\.\s*position\s*\.\s*(?:set|copy)\s*\(/.test(playText)) ||
    /\b(?:set|copy)\w*(?:Vec|Vector)\w*\s*\(\s*(?:xrDevice|device|headset|viewer)\s*\.\s*position\b/i.test(playText)
  if (!setsViewerPosition) {
    issues.push('- vitexec script does not move the emulated headset/viewer position.')
  }
  const hasStaticViewerMovementProof =
    /\bmilestone:(?:viewer|headset|walk|approach|move)/i.test(playText) ||
    /\b(?:logMilestone|milestone)\s*\(\s*['"](?:viewer-move|headset-move|walk|approach|move)/i.test(playText)
  if (!hasStaticViewerMovementProof) {
    issues.push('- vitexec script does not log viewer/headset movement milestones for the recording.')
  }

  return issues
}

async function getPackageDependencyIssue(appDir) {
  const packageJsonText = await readOptionalText(path.join(appDir, 'package.json'))
  if (packageJsonText.trim() === '') return null

  let packageJson
  try {
    packageJson = JSON.parse(packageJsonText)
  } catch {
    return '- package.json is not valid JSON.'
  }

  const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) }
  const dreiMajor = getSemverMajor(deps['@react-three/drei'])
  const fiberMajor = getSemverMajor(deps['@react-three/fiber'])
  const reactMajor = getSemverMajor(deps.react)
  const reactDomMajor = getSemverMajor(deps['react-dom'])
  const iwerMajor = getSemverMajor(deps.iwer)

  if (iwerMajor != null && iwerMajor < 2) {
    return '- package.json uses an old or unpublished IWER range; use a published `iwer` 2.x release for vitexec WebXR validation.'
  }

  if (dreiMajor != null && dreiMajor >= 10) {
    if (fiberMajor != null && fiberMajor < 9) {
      return '- package.json mixes @react-three/drei 10.x with @react-three/fiber <9; use React 19 + fiber 9 or remove drei.'
    }
    if (reactMajor != null && reactMajor < 19) {
      return '- package.json mixes @react-three/drei 10.x with React <19; use a compatible React/fiber/drei set or remove drei.'
    }
    if (reactDomMajor != null && reactDomMajor < 19) {
      return '- package.json mixes @react-three/drei 10.x with react-dom <19; use a compatible React/fiber/drei set or remove drei.'
    }
  }

  if (fiberMajor != null && fiberMajor >= 9) {
    if (reactMajor != null && reactMajor < 19) {
      return '- package.json uses @react-three/fiber 9.x with React <19; update React/React DOM or use a compatible fiber major.'
    }
    if (reactDomMajor != null && reactDomMajor < 19) {
      return '- package.json uses @react-three/fiber 9.x with react-dom <19; update React/React DOM or use a compatible fiber major.'
    }
  }

  return null
}

function getSemverMajor(versionRange) {
  if (typeof versionRange !== 'string') return null
  const match = versionRange.match(/\d+/)
  return match == null ? null : Number(match[0])
}

function hasVitexecAppStateBypass(playText) {
  const bypassNames = '(?:selectStation|completeStation|markStation|setCompleted|setProgress|advanceStep|finishStep)'
  const propertyCall = new RegExp(`\\.\\s*${bypassNames}\\s*\\(`, 'i')
  if (propertyCall.test(playText)) return true

  const bridgeDestructure = new RegExp(
    `\\b(?:const|let|var)\\s*\\{[^}]*\\b${bypassNames}\\b[^}]*\\}\\s*=\\s*[^;\\n]*(?:window|globalThis|__\\w+|trainer|app|store|state|bridge)`,
    'i',
  )
  if (bridgeDestructure.test(playText)) return true

  const bridgeAlias = new RegExp(
    `\\b(?:const|let|var)\\s+\\w+\\s*=\\s*[^;\\n]*(?:window|globalThis|__\\w+|trainer|app|store|state|bridge)[^;\\n]*\\.\\s*${bypassNames}\\b`,
    'i',
  )
  return bridgeAlias.test(playText)
}

function getImmersiveUiQualityIssue(caseName, sourceText, playText) {
  const hasImmersiveVrProof = /\benterVR\s*\(|immersive-vr\b/i.test(sourceText) || /\benterVR\s*\(|immersive-vr\b/i.test(playText)
  const isHandheldArOverlayCase =
    ['ar-placement', 'ar-furniture-commerce'].includes(caseName) &&
    !hasImmersiveVrProof &&
    /\benterAR\s*\(|immersive-ar\b/i.test(sourceText)
  const needsInScenePanel =
    caseName !== 'ar-placement' ||
    hasImmersiveVrProof ||
    /\b(checklist|status|panel|report|score|progress|task|prompt|control)\b/i.test(sourceText)
  const hasUikit =
    /@react-three\/uikit\b|@pmndrs\/uikit\b|\bfrom\s+['"]@react-three\/uikit(?:-[^'"]+)?['"]|\bfrom\s+['"]@pmndrs\/uikit(?:-[^'"]+)?['"]/.test(
      sourceText,
    )
  const hasDomOnlyXrUi =
    /\bimport\s+\{[^}]*\bHtml\b[^}]*\}\s+from\s+['"]@react-three\/drei['"]|<\s*Html\b|\bXRDomOverlay\b|<\s*XRDomOverlay\b/.test(
      sourceText,
    )

  if (needsInScenePanel && !isHandheldArOverlayCase && !hasUikit) {
    return '- Immersive checklist/status/report UI must be rendered inside WebXR, preferably with @react-three/uikit; DOM/HTML panels do not exist in headset VR.'
  }
  if (hasImmersiveVrProof && hasDomOnlyXrUi) {
    return '- Uses HTML/DOM overlay (`Html` or `XRDomOverlay`) for an immersive VR/non-handheld XR flow; use in-scene uikit/3D UI instead.'
  }
  return null
}

function getCaseSpecificGeneratedQualityIssue(caseName, sourceText, playText) {
  switch (caseName) {
    case 'arcade-shooter':
      if (!/\b(shoot|shot|target|wave|ammo|reload|accuracy|score|hit|miss)\b/i.test(sourceText)) {
        return '- Arcade shooter case lacks obvious shooting, targets, waves, ammo/accuracy, or scoring behavior.'
      }
      if (!/\b(gun|blaster|pistol|barrel|muzzle|weapon)\b/i.test(sourceText)) {
        return '- Arcade shooter should attach a visible gun/blaster model to the controller instead of relying on a generic controller pointer.'
      }
      if (!/\b(muzzle|raycast|Raycaster|projectile|tracer|recoil|beam|laserBolt|bullet)\b/i.test(sourceText)) {
        return '- Arcade shooter should shoot from a weapon muzzle with projectile/tracer/recoil feedback.'
      }
      return null
    case 'fitness-reaction':
      if (!/\b(pad|punch|combo|round|streak|reaction|accuracy|score|hit|miss|late)\b/i.test(sourceText)) {
        return '- Fitness reaction case lacks obvious pad/combo/round/reaction scoring behavior.'
      }
      if (!/\b(glove|fist|hand|punch|contact|collision|proximity|distanceTo|near|reach|sphere)\b/i.test(sourceText)) {
        return '- Fitness reaction should use punch-like near interaction with gloves/fists/contact volumes, not only controller pointer selection.'
      }
      if (/\brayPointer\b|PointerRay|RayPointer/i.test(sourceText) && !/\b(glove|fist|contact|collision|proximity|distanceTo)\b/i.test(sourceText)) {
        return '- Fitness reaction over-relies on ray pointers; boxing pads should be hit with near hand/controller contact.'
      }
      return null
    case 'product-configurator':
      if (!/\b(config|module|variant|material|swatch|price|dimension|snap|selected|transform|handle)\b/i.test(sourceText)) {
        return '- Product configurator case lacks obvious configurable modules, variants, transform, or summary behavior.'
      }
      return getManipulationQualityIssue(
        'Product configurator',
        sourceText,
        playText,
        { requireHandles: true, requireSnap: true, requireRotate: true },
      )
    case 'robot-arm-teach':
      if (!/\b(robot|waypoint|path|teach|program|reach|safety|tool|orientation|cell)\b/i.test(sourceText)) {
        return '- Robot-arm teach case lacks obvious robot cell, waypoint/path, reach/safety, or program behavior.'
      }
      return getManipulationQualityIssue(
        'Robot-arm teach',
        sourceText,
        playText,
        { requireHandles: true, requireSnap: false, requireRotate: true },
      )
    case 'assembly-bench':
      if (!/\b(assembly|bench|bracket|sensor|rail|snap|alignment|tolerance|fastener|clip)\b/i.test(sourceText)) {
        return '- Assembly bench case lacks obvious bench, parts, rail/snap, alignment, or readiness behavior.'
      }
      return getManipulationQualityIssue(
        'Assembly bench',
        sourceText,
        playText,
        { requireHandles: true, requireSnap: true, requireRotate: true },
      )
    case 'ar-furniture-commerce':
      if (!/\b(room|furniture|sofa|chair|table|lamp|product|shop|commerce|cart|price|variant|material|swatch|dimension|fit|footprint)\b/i.test(sourceText)) {
        return '- AR furniture commerce case lacks obvious product, room fit, variant/material, price, or cart behavior.'
      }
      if (!/\benterAR\s*\(|immersive-ar\b/i.test(sourceText)) {
        return '- AR furniture commerce case should enter an AR session, not only a VR or desktop showroom.'
      }
      if (!/\b(hit.?test|XRHitTest|useXRHitTest|useXRRequestHitTest|anchor|plane|surface|floor|reticle|placement)\b/i.test(sourceText)) {
        return '- AR furniture commerce should use hit-test, planes, anchors, a floor reticle, or equivalent surface placement affordance.'
      }
      return getPlacementQualityIssue('AR furniture commerce', sourceText, playText, { requireVariant: true, requireScaleOrRotate: true })
    case 'drone-flight-sim':
      if (!/\b(drone|flight|pilot|prop|rotor|waypoint|checkpoint|gate|telemetry|altitude|battery|landing|inspection|mission)\b/i.test(sourceText)) {
        return '- Drone flight sim case lacks obvious drone flight, waypoint, telemetry, landing, or mission behavior.'
      }
      if (!/\b(useFrame|requestAnimationFrame|velocity|speed|throttle|pitch|yaw|roll|altitude|position|quaternion|route|gate|checkpoint)\b/i.test(sourceText)) {
        return '- Drone flight sim should visibly update simulated motion over time from pilot/controller input.'
      }
      if (!/\b(warning|hazard|collision|proximity|battery|crosswind|wind|recovery|fail|risk)\b/i.test(sourceText)) {
        return '- Drone flight sim should include a warning, hazard, failure, or recovery condition.'
      }
      return getSimulationQualityIssue('Drone flight sim', playText)
    default:
      return null
  }
}

function getPlacementQualityIssue(label, sourceText, playText, options) {
  const hasPlace = /\b(place|placement|placed|reticle|surface|floor|plane|anchor|snap|footprint|fit)\b/i.test(sourceText)
  const hasVariant = /\b(variant|material|swatch|color|fabric|finish|price|cart|summary)\b/i.test(sourceText)
  const hasScaleOrRotate = /\b(rotate|rotation|scale|resize|dimension|footprint|quaternion|yaw|angle)\b/i.test(sourceText)
  const hasPlacementMilestone = hasManipulationMilestone(playText, '(?:place|placement|anchor|surface|fit)')
  const hasVariantMilestone = /\bmilestone:[^\n]*(?:variant|material|swatch|cart|config|summary)|\b(?:logMilestone|milestone)\s*\(\s*['"][^'"]*(?:variant|material|swatch|cart|config|summary)/i.test(playText)
  const hasBeforeAfter =
    /\b(before|initial|start(?:ing)?Transform|after|final|delta|changed|placed|rotated|scaled)\b/i.test(playText) &&
    /\b(position|rotation|quaternion|scale|matrix|transform|variant|material)\b/i.test(playText)

  if (!hasPlace) return `- ${label} should expose visible surface placement and fit/footprint feedback.`
  if (options.requireVariant && !hasVariant) return `- ${label} should support product variants/materials and commercial summary state.`
  if (options.requireScaleOrRotate && !hasScaleOrRotate) return `- ${label} should support spatial rotate, scale, or dimension adjustment.`
  if (!hasPlacementMilestone) return `- ${label} vitexec walkthrough should log a placement/surface/fit milestone.`
  if (options.requireVariant && !hasVariantMilestone) return `- ${label} vitexec walkthrough should log variant/material/cart/configuration progress.`
  if (!hasBeforeAfter) return `- ${label} vitexec walkthrough should assert before/after placement transform or variant changes.`
  return null
}

function getSimulationQualityIssue(label, playText) {
  const hasMotionMilestone =
    /\bmilestone:[^\n]*(?:drone|flight|motion|move|pilot|route|waypoint|checkpoint|gate)|\b(?:logMilestone|milestone)\s*\(\s*['"][^'"]*(?:drone|flight|motion|move|pilot|route|waypoint|checkpoint|gate)/i.test(playText)
  const hasWarningMilestone =
    /\bmilestone:[^\n]*(?:warning|hazard|collision|proximity|battery|wind|recovery)|\b(?:logMilestone|milestone)\s*\(\s*['"][^'"]*(?:warning|hazard|collision|proximity|battery|wind|recovery)/i.test(playText)
  const hasBeforeAfter =
    /\b(before|initial|start(?:ing)?State|after|final|delta|changed|moved|flew|landed)\b/i.test(playText) &&
    /\b(position|rotation|quaternion|velocity|speed|altitude|battery|waypoint|checkpoint|telemetry|state)\b/i.test(playText)

  if (!hasMotionMilestone) return `- ${label} vitexec walkthrough should log simulated motion or waypoint/checkpoint progress from input.`
  if (!hasWarningMilestone) return `- ${label} vitexec walkthrough should log a warning, hazard, or recovery event.`
  if (!hasBeforeAfter) return `- ${label} vitexec walkthrough should assert before/after simulated state changes, not only final counters.`
  return null
}

function getManipulationQualityIssue(label, sourceText, playText, options) {
  const hasHandlePackage = /@react-three\/handle\b/.test(sourceText)
  const hasHandleComponent = /<\s*(?:Handle|HandleTarget|TransformHandles|PivotHandles|OrbitHandles|MapHandles)\b/.test(sourceText)
  const hasTransformHandle = /<\s*(?:TransformHandles|PivotHandles|HandleTarget)\b|\bTransformHandles\b|\bPivotHandles\b|\bHandleTarget\b/.test(sourceText)
  const hasDragOrTranslate = /\b(drag|translate|translation|move|position|grab|grabbable|dragging|onDrag)\b/i.test(sourceText)
  const hasRotate = /\b(rotate|rotation|quaternion|orientation|angle|pivot|yaw|pitch|roll)\b/i.test(sourceText)
  const hasSnap = /\b(snap|mount|attach|socket|alignment|align|tolerance|constraint)\b/i.test(sourceText)
  const hasBeforeAfter =
    /\b(before|initial|start(?:ing)?Transform|after|final|delta|changed|moved|rotated)\b/i.test(playText) &&
    /\b(position|rotation|quaternion|scale|matrix|transform)\b/i.test(playText)
  const hasDragMilestone = hasManipulationMilestone(playText, '(?:drag|grab|translate|move)')
  const hasRotateMilestone = hasManipulationMilestone(playText, '(?:rotate|rotation|orientation)')
  const hasSnapMilestone =
    hasManipulationMilestone(playText, '(?:snap|align|mount|attach)') ||
    /\bmilestone:(?:drag|grab|translate|move|transform)[^\n]*[\s\S]{0,900}\b(?:snapped|snap|mount|attach|align)/i.test(
      playText,
    ) ||
    /\b(?:logMilestone|milestone)\s*\(\s*['"](?:drag|grab|translate|move|transform)['"][\s\S]{0,900}\b(?:snapped|snap|mount|attach|align)/i.test(
      playText,
    )
  const holdsTriggerDuringMotion = hasTriggerHeldMotionProof(playText)

  if (options.requireHandles && !hasHandlePackage) {
    return `- ${label} should install/import @react-three/handle for documented manipulation affordances.`
  }
  if (options.requireHandles && !hasHandleComponent) {
    return `- ${label} should render documented handle components such as HandleTarget, TransformHandles, or PivotHandles.`
  }
  if (!hasTransformHandle) {
    return `- ${label} should expose visible transform/rotation handle affordances, not only indirect panel buttons.`
  }
  if (!hasDragOrTranslate) {
    return `- ${label} should support a visible controller-driven drag/translate/grab operation.`
  }
  if (options.requireRotate && !hasRotate) {
    return `- ${label} should support controller-driven rotation/orientation editing.`
  }
  if (options.requireSnap && !hasSnap) {
    return `- ${label} should support snapping/alignment or constrained placement feedback.`
  }
  if (!hasDragMilestone) {
    return `- ${label} vitexec walkthrough should log a controller-driven drag/grab/translate manipulation milestone.`
  }
  if (options.requireRotate && !hasRotateMilestone) {
    return `- ${label} vitexec walkthrough should log a controller-driven rotate/orientation manipulation milestone.`
  }
  if (options.requireSnap && !hasSnapMilestone) {
    return `- ${label} vitexec walkthrough should log a snap/alignment manipulation milestone.`
  }
  if (!hasBeforeAfter) {
    return `- ${label} vitexec walkthrough should assert before/after transform changes, not only final counters.`
  }
  if (!holdsTriggerDuringMotion) {
    return `- ${label} vitexec walkthrough should hold controller trigger/select while moving or rotating the controller to prove manipulation input.`
  }
  return null
}

function hasManipulationMilestone(playText, pattern) {
  return new RegExp(`\\bmilestone:[^\\n]*(?:${pattern})`, 'i').test(playText) ||
    new RegExp(`\\b(?:logMilestone|milestone)\\s*\\(\\s*['"][^'"]*(?:${pattern})`, 'i').test(playText)
}

function hasTriggerHeldMotionProof(playText) {
  const triggerDown = `(?:updateButtonValue\\s*\\(\\s*['"]trigger['"]\\s*,\\s*1|\\b\\w*(?:trigger|select)\\w*\\s*\\(\\s*1|\\b(?:hold|start|press|set)\\w*(?:Trigger|Select)\\w*\\s*\\()`
  const triggerUp = `(?:updateButtonValue\\s*\\(\\s*['"]trigger['"]\\s*,\\s*0|\\b\\w*(?:trigger|select)\\w*\\s*\\(\\s*0|\\b(?:release|stop|end|clear)\\w*(?:Trigger|Select)\\w*\\s*\\()`
  const controllerMotion = `(?:(?:position|quaternion)\\s*\\.\\s*(?:set|copy)\\s*\\(|aim\\w*Controller\\w*\\s*\\(|move\\w*Controller\\w*\\s*\\(|set\\w*Controller\\w*\\s*\\()`
  const orderedProof = new RegExp(`${triggerDown}[\\s\\S]{0,2800}${controllerMotion}[\\s\\S]{0,2800}${triggerUp}`, 'i')
  return orderedProof.test(playText)
}

function getOutputQualityIssue(sourceText) {
  const geometryMatches =
    sourceText.match(
      /\b(?:boxGeometry|sphereGeometry|cylinderGeometry|planeGeometry|torusGeometry|coneGeometry|capsuleGeometry|extrudeGeometry|textGeometry|BoxGeometry|SphereGeometry|CylinderGeometry|PlaneGeometry|TorusGeometry|ConeGeometry|CapsuleGeometry|ExtrudeGeometry|TextGeometry)\b/g,
    ) ?? []
  const uniqueGeometryCount = new Set(geometryMatches.map((value) => value.toLowerCase().replace(/geometry$/, 'geometry'))).size
  const hasLighting = /\b(?:ambientLight|directionalLight|pointLight|spotLight|HemisphereLight|DirectionalLight|PointLight|SpotLight)\b/.test(sourceText)
  const hasFeedback = /\b(hit|miss|hover|selected|active|complete|success|fail|score|flash|burst|particle|spark|trail|pulse|wave|combo|accuracy|progress)\b/i.test(sourceText)
  const hasEnvironment = /\b(floor|wall|room|lane|range|studio|warehouse|showroom|station|rail|grid|boundary|environment|scene)\b/i.test(sourceText)

  if (uniqueGeometryCount < 3) return '- Visual quality gate: use at least three distinct geometry/object types, not placeholder boxes only.'
  if (!hasLighting) return '- Visual quality gate: missing obvious scene lighting.'
  if (!hasFeedback) return '- Visual quality gate: missing obvious visual feedback for interaction state.'
  if (!hasEnvironment) return '- Visual quality gate: missing recognizable environment context.'
  return null
}

async function getGeneratedScaffoldIssue(appDir) {
  if (!(await isFile(path.join(appDir, 'package.json')))) {
    return 'Builder stopped before scaffolding a runnable app. Missing package.json.'
  }
  if (!(await hasAuthoredAppSource(appDir))) {
    return 'Builder did not leave editable app source under src/. A dist-only artifact is not acceptable for this eval.'
  }
  if (!(await isFile(path.join(appDir, 'vitexec', 'play.ts')))) {
    return 'Builder stopped before creating the required XR walkthrough at ./vitexec/play.ts.'
  }
  return null
}

async function hasAuthoredAppSource(appDir) {
  const files = await listGeneratedFiles(path.join(appDir, 'src'))
  return files.some((filePath) => /\.(?:tsx|jsx|ts|js)$/.test(filePath) && !/vite-env\.d\.ts$/.test(filePath))
}

async function runAgentReview(runtime, builderHistory) {
  const result = await runCodexExec(runtime, {
    label: 'review',
    prompt: `Review this primary agent message history for the generated XR experience.

Do not edit files. Return a concise final review only.

Start with exactly one verdict line:
- PASS: when there is no hard blocking issue.
- FAIL: when the agent used deprecated XR APIs for new work, skipped createXRStore/<XR>, made a toy/placeholder scene instead of the requested use case, put the primary status/score/report/control UI only in DOM/HTML instead of in the WebXR scene, used @react-three/drei Html or XRDomOverlay as immersive VR/non-handheld UI instead of @react-three/uikit or equivalent 3D UI, made in-scene UI cover most of the viewport for most of the recording, contaminated validation by weakening requirements, validated only state without visible/browser evidence, used only a laptop/non-XR walkthrough instead of IWER/WebXR for the passing validation, kept the emulated headset/viewer fixed while only moving the controller, pointed the viewer away from the scene so the recording is mostly blank/white, placed the viewer unrealistically close to interaction targets, skipped view-composition checks, used a generic controller pointer when the use case calls for a gun, glove, hand, collision, vehicle/tool controls, placement reticle, or other domain-specific interaction, skipped visible handle/gizmo manipulation for an editor/configurator/assembly task, failed to prove before/after object transforms for drag/rotate/snap/placement workflows, skipped visible simulation motion/telemetry for simulation tasks, skipped surface placement and variant/fit feedback for AR commerce tasks, or produced poor visual quality with only placeholder cubes and no domain-specific feedback.

Put non-blocking concerns after PASS as "Notes:" and do not use FAIL for concerns you would not block on.

${historyForReview(builderHistory)}`,
    outputPath: path.join(runtime.runDir, 'agent-review.txt'),
    jsonlPath: path.join(runtime.runDir, 'agent-review-history.jsonl'),
    historyPath: path.join(runtime.runDir, 'agent-review-history.txt'),
    stderrPath: path.join(runtime.runDir, 'agent-review-stderr.txt'),
    timeoutMs: Number(process.env.EVAL_REVIEW_TIMEOUT_MS ?? 5 * 60_000),
    idleTimeoutMs: Number(process.env.EVAL_REVIEW_IDLE_TIMEOUT_MS ?? 2 * 60_000),
  })
  return result.text.trim() || 'No agent review returned.'
}

async function runCodexExec(runtime, options) {
  await mkdir(path.dirname(options.outputPath), { recursive: true })
  const promptHistory = `Prompt:\n${options.prompt}`
  await writeFile(options.historyPath, `${promptHistory}\n\n`)

  const codexArgs = [
    'codex',
    '--disable',
    'plugins',
    '--disable',
    'apps',
    '--disable',
    'remote_plugin',
    '-m',
    process.env.EVAL_MODEL ?? 'gpt-5.5',
    '-c',
    `model_reasoning_effort="${process.env.EVAL_REASONING_EFFORT ?? 'high'}"`,
    '-s',
    'danger-full-access',
    '-a',
    'never',
    'exec',
    '--ignore-user-config',
    '--json',
    '--skip-git-repo-check',
    '-C',
    CONTAINER_APP,
    '-o',
    toContainerPath(runtime, options.outputPath),
    options.prompt,
  ]

  const containerName = `pmndrs-xr-eval-${options.label}-${process.pid}`
  const child = spawn('docker', dockerRunArgs(runtime, codexArgs, { name: containerName, workdir: CONTAINER_APP }), {
    cwd: runtime.repoCwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const jsonl = createWriteStream(options.jsonlPath)
  const stderr = createWriteStream(options.stderrPath)
  const history = [promptHistory]
  let stdoutBuffer = ''
  let stopped = false
  let stopIssue

  const stop = async (message) => {
    if (stopped) return
    stopped = true
    stopIssue = message
    await appendHistory(options.historyPath, `Error:\n${message}`)
    try {
      await execFileAsync('docker', ['rm', '-f', containerName], { timeout: 5000 })
    } catch {
      // Container may already be gone.
    }
    child.kill('SIGTERM')
  }

  const totalTimer = setTimeout(() => void stop(`Codex timed out after ${formatDuration(options.timeoutMs)}.`), options.timeoutMs)
  let idleTimer = setTimeout(
    () => void stop(`Codex produced no JSONL progress for ${formatDuration(options.idleTimeoutMs)}.`),
    options.idleTimeoutMs,
  )
  const resetIdleTimer = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(
      () => void stop(`Codex produced no JSONL progress for ${formatDuration(options.idleTimeoutMs)}.`),
      options.idleTimeoutMs,
    )
  }

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8')
    jsonl.write(text)
    stdoutBuffer += text
    let newline = stdoutBuffer.indexOf('\n')
    while (newline !== -1) {
      const line = stdoutBuffer.slice(0, newline).trim()
      stdoutBuffer = stdoutBuffer.slice(newline + 1)
      if (line.length > 0) {
        resetIdleTimer()
        const entry = formatCodexEvent(line)
        if (entry != null) {
          history.push(entry)
          streamCodexEvent(options.label, entry)
          void appendHistory(options.historyPath, entry)
        }
        const command = getCodexEventCommand(line)
        if (command != null) {
          const forbiddenIssue = getForbiddenCommandIssue(command)
          if (forbiddenIssue != null) {
            void stop(forbiddenIssue)
          } else if (isDevServerCommand(command)) {
            void stop('Agent started a long-running dev server instead of using vitexec.')
          }
        }
      }
      newline = stdoutBuffer.indexOf('\n')
    }
  })
  child.stderr.on('data', (chunk) => stderr.write(chunk))

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code, signal) => resolve(typeof code === 'number' ? code : signal == null ? 1 : 128))
  })
  clearTimeout(totalTimer)
  clearTimeout(idleTimer)
  await closeStream(jsonl)
  await closeStream(stderr)

  const text = await readOptionalText(options.outputPath)
  const finalHistory = stopIssue == null ? history.join('\n\n') : `${history.join('\n\n')}\n\nError:\n${stopIssue}`
  return { text, history: finalHistory, exitCode: stopIssue == null ? exitCode : 1 }
}

async function ensureDockerImage(repoCwd) {
  if (process.env.EVAL_DOCKER_REBUILD !== '1') {
    try {
      await execFileAsync('docker', ['image', 'inspect', IMAGE], { timeout: 30_000 })
      log(`docker image: ${IMAGE}`)
      return
    } catch {
      // Build below.
    }
  }
  log(`docker build: ${IMAGE}`)
  await execFileAsync('docker', ['build', '-t', IMAGE, '-f', path.join(repoCwd, DOCKERFILE), path.dirname(DOCKERFILE)], {
    cwd: repoCwd,
    timeout: 60 * 60_000,
    maxBuffer: 100 * 1024 * 1024,
  })
}

async function prepareCodexHome(runDir) {
  const codexHomeDir = path.join(runDir, 'codex-home')
  await mkdir(codexHomeDir, { recursive: true })
  const authPath = process.env.EVAL_CODEX_AUTH_PATH ?? path.join(homedir(), '.codex', 'auth.json')
  if (await isFile(authPath)) {
    await cp(authPath, path.join(codexHomeDir, 'auth.json'))
  } else if (!process.env.OPENAI_API_KEY) {
    throw new Error(`Codex auth is missing. Expected ${authPath} or OPENAI_API_KEY.`)
  }
  return codexHomeDir
}

async function startPlaywrightServer(repoCwd) {
  const child = spawn(path.join(repoCwd, 'node_modules', '.bin', 'playwright'), ['run-server', '--host', '127.0.0.1', '--port', '0'], {
    cwd: repoCwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''

  const wsEndpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Playwright run-server.')), 30_000)
    const finish = (callback) => {
      clearTimeout(timer)
      child.stdout.off('data', onStdout)
      child.stderr.off('data', onStderr)
      child.off('error', onError)
      child.off('exit', onExit)
      callback()
    }
    const onStdout = (chunk) => {
      stdout += chunk.toString('utf8')
      const match = stdout.match(/Listening on (ws:\/\/\S+)/)
      if (match) finish(() => resolve(match[1]))
    }
    const onStderr = (chunk) => {
      stderr += chunk.toString('utf8')
    }
    const onError = (error) => finish(() => reject(error))
    const onExit = (code) => finish(() => reject(new Error(`Playwright run-server exited with ${code ?? 'signal'}.\n${stderr || stdout}`)))
    child.stdout.on('data', onStdout)
    child.stderr.on('data', onStderr)
    child.on('error', onError)
    child.on('exit', onExit)
  })

  const url = new URL(wsEndpoint)
  url.hostname = 'host.docker.internal'
  log(`browser ws: ${url}`)
  return {
    dockerWsEndpoint: url.toString(),
    server: {
      close: async () => {
        if (child.exitCode != null || child.signalCode != null) return
        await new Promise((resolve) => {
          const timer = setTimeout(() => {
            child.kill('SIGKILL')
            resolve()
          }, 5000)
          child.once('close', () => {
            clearTimeout(timer)
            resolve()
          })
          child.kill('SIGTERM')
        })
      },
    },
  }
}

async function dockerExec(runtime, command, { workdir, timeoutMs }) {
  try {
    const { stdout, stderr } = await execFileAsync('docker', dockerRunArgs(runtime, command, { workdir }), {
      cwd: runtime.repoCwd,
      timeout: timeoutMs,
      maxBuffer: 100 * 1024 * 1024,
    })
    return { stdout: String(stdout ?? ''), stderr: String(stderr ?? ''), exitCode: 0 }
  } catch (error) {
    return commandErrorResult(error)
  }
}

function dockerRunArgs(runtime, command, { workdir, name }) {
  const args = [
    'run',
    '--rm',
    '--init',
    '--add-host',
    'host.docker.internal:host-gateway',
    '-v',
    `${runtime.runDir}:${CONTAINER_WORKSPACE}`,
    '-v',
    `${runtime.codexHomeDir}:/codex-home`,
    '-w',
    workdir,
    '-e',
    'CODEX_HOME=/codex-home',
    '-e',
    'SHELL=/bin/bash',
    '-e',
    'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1',
    '-e',
    'CI=1',
    '-e',
    `VITEXEC_RECORD_WIDTH=${positiveIntegerEnv('EVAL_RECORD_WIDTH', DEFAULT_RECORD_WIDTH)}`,
    '-e',
    `VITEXEC_RECORD_HEIGHT=${positiveIntegerEnv('EVAL_RECORD_HEIGHT', DEFAULT_RECORD_HEIGHT)}`,
  ]
  if (runtime.browserWsEndpoint != null) {
    args.push('-e', `VITEXEC_BROWSER_WS_ENDPOINT=${runtime.browserWsEndpoint}`)
    args.push('-e', `VITEXEC_BROWSER_EXPOSE_NETWORK=${runtime.browserExposeNetwork}`)
  }
  if (name) args.push('--name', name)
  if (process.env.OPENAI_API_KEY) args.push('-e', 'OPENAI_API_KEY')
  args.push(IMAGE, ...command)
  return args
}

function positiveIntegerEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function toContainerPath(runtime, hostPath) {
  const runDir = normalizeAbsolutePath(runtime.runDir)
  const filePath = normalizeAbsolutePath(hostPath)
  if (filePath === runDir) return CONTAINER_WORKSPACE
  if (!filePath.startsWith(`${runDir}/`)) throw new Error(`Path is outside the mounted run directory: ${hostPath}`)
  return `${CONTAINER_WORKSPACE}/${filePath.slice(runDir.length + 1)}`
}

async function readGeneratedTreeText(root) {
  const chunks = []
  for (const filePath of await listGeneratedFiles(root)) {
    if (/package-lock\.json$/.test(filePath)) continue
    if (!/\.(?:ts|tsx|js|jsx|css|html|json)$/.test(filePath)) continue
    chunks.push(await readOptionalText(filePath))
  }
  return chunks.join('\n')
}

async function listGeneratedFiles(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    const files = await Promise.all(
      entries.map(async (entry) => {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '.agents' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === 'artifacts'
        ) {
          return []
        }
        const entryPath = path.join(root, entry.name)
        if (entry.isDirectory()) return await listGeneratedFiles(entryPath)
        if (entry.isFile()) return [entryPath]
        return []
      }),
    )
    return files.flat()
  } catch {
    return []
  }
}

async function getVideoDurationSeconds(videoPath) {
  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', videoPath],
      { timeout: 30_000 },
    )
    const duration = Number(String(stdout).trim())
    return Number.isFinite(duration) ? duration : null
  } catch {
    log('ffprobe unavailable; skipping video duration check')
    return null
  }
}

async function extractViewCheckFrames(videoPath, runDir, vitexecResult, duration) {
  const checks = parseViewChecks(`${vitexecResult.stdout}\n${vitexecResult.stderr}`)
  if (checks.length === 0) return

  const framesDir = path.join(runDir, 'view-check-frames')
  await mkdir(framesDir, { recursive: true })
  const selected = checks.slice(0, 6)
  for (let index = 0; index < selected.length; index += 1) {
    const check = selected[index]
    const elapsedSeconds = getViewCheckElapsedSeconds(check, duration)
    if (elapsedSeconds == null) continue
    const outputPath = path.join(framesDir, `view-check-${String(index + 1).padStart(2, '0')}-${sanitizeFilename(check.station ?? 'station')}.png`)
    try {
      await execFileAsync(
        'ffmpeg',
        ['-y', '-ss', elapsedSeconds.toFixed(3), '-i', videoPath, '-frames:v', '1', '-update', '1', outputPath],
        { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
      )
    } catch {
      log('ffmpeg unavailable or frame extraction failed; skipping view-check frame extraction')
      return
    }
  }
  log(`view-check frames: ${framesDir}`)
}

async function getUikitCoverageIssue(runtime, appDir, runDir) {
  const sourceText = await readGeneratedTreeText(appDir)
  if (!/@react-three\/uikit\b|@pmndrs\/uikit\b/.test(sourceText)) return null

  const auditScriptPath = path.join(appDir, 'vitexec', '__eval-uikit-coverage.ts')
  await writeFile(auditScriptPath, UIKIT_COVERAGE_AUDIT_SCRIPT)
  const result = await dockerExec(
    runtime,
    ['node_modules/.bin/vitexec', '--gpu', toContainerPath(runtime, auditScriptPath)],
    { workdir: CONTAINER_APP, timeoutMs: Number(process.env.EVAL_UI_COVERAGE_TIMEOUT_MS ?? 8 * 60_000) },
  )
  await writeRunFile(runDir, 'uikit-coverage-stdout.txt', result.stdout)
  await writeRunFile(runDir, 'uikit-coverage-stderr.txt', result.stderr)

  const summary = parseUikitCoverageSummary(`${result.stdout}\n${result.stderr}`)
  if (summary != null) {
    await writeRunFile(runDir, 'uikit-coverage-summary.json', `${JSON.stringify(summary, null, 2)}\n`)
  }

  if (result.exitCode !== 0) {
    return `The uikit scene coverage audit failed with exit code ${result.exitCode}.\nstdout:\n${truncate(result.stdout, 2500)}\nstderr:\n${truncate(result.stderr, 2500)}`
  }
  if (summary == null) {
    return 'The uikit scene coverage audit did not emit `milestone:ui-coverage-summary`.'
  }
  if ((summary.usableSampleCount ?? 0) < 3 || (summary.maxRootCount ?? 0) < 1) {
    return `The app imports uikit, but the runtime audit could not find uikit roots through window.__pmndrsXrEval during the walkthrough. Metrics: ${JSON.stringify(summary)}`
  }
  const samples = Array.isArray(summary.samples) ? summary.samples : []
  const visibleRootSamples = samples.filter((sample) => Number(sample.rootCount) > 0)
  if (Array.isArray(summary.coverageErrors) && summary.coverageErrors.length > visibleRootSamples.length * 0.5) {
    return `The uikit scene coverage audit hit projection errors for most samples. Fix the audit bridge/component bounds or simplify uikit placement before accepting the run. Metrics: ${JSON.stringify(summary)}`
  }

  const coverageThreshold = envNumber('EVAL_UI_COVERAGE_THRESHOLD', DEFAULT_UI_COVERAGE_THRESHOLD)
  const timeRatioThreshold = envNumber('EVAL_UI_COVERAGE_TIME_RATIO', DEFAULT_UI_COVERAGE_TIME_RATIO)
  const highCoverageRatio = getHighUikitCoverageRatio(summary, coverageThreshold)
  if (Number.isFinite(highCoverageRatio) && highCoverageRatio >= timeRatioThreshold) {
    return `Uikit roots covered more than ${formatPercent(coverageThreshold)} of the headset view for ${formatPercent(highCoverageRatio)} of sampled play time. Keep persistent UI compact/peripheral and frame the world target. Metrics: ${JSON.stringify(summary)}`
  }
  return null
}

function getHighUikitCoverageRatio(summary, coverageThreshold) {
  const samples = Array.isArray(summary.samples) ? summary.samples : []
  const usable = samples.filter((sample) => Number(sample.rootCount) > 0)
  if (usable.length === 0) return Number(summary.highCoverageRatio)
  const high = usable.filter((sample) => Number(sample.coverage) > coverageThreshold)
  return high.length / usable.length
}

function parseUikitCoverageSummary(text) {
  let summary = null
  for (const line of text.split(/\r?\n/)) {
    const marker = 'milestone:ui-coverage-summary '
    const markerIndex = line.indexOf(marker)
    if (markerIndex === -1) continue
    try {
      summary = JSON.parse(line.slice(markerIndex + marker.length).trim())
    } catch {
      summary = null
    }
  }
  return summary
}

const UIKIT_COVERAGE_AUDIT_SCRIPT = String.raw`
import { Box3, Quaternion, Vector3 } from 'three'

const SAMPLE_INTERVAL_MS = 250
const GRID_COLUMNS = 64
const GRID_ROWS = 36
const startedAt = performance.now()
const samples = []
const coverageErrors = []
let missingGlobalSamples = 0
let playError = null

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const round = (value) => Number(value.toFixed(3))
const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value))

function signalValue(value) {
  if (value == null) return value
  if (typeof value.peek === 'function') {
    try {
      return value.peek()
    } catch {
      return value
    }
  }
  if (typeof value === 'object' && 'value' in value) return value.value
  return value
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

function getDebugState() {
  return window.__pmndrsXrEval
}

function isUikitObject(object) {
  return Boolean(object?.isObject3D && object.root && (object.size || signalValue(object.root)?.size || object.properties || signalValue(object.root)?.properties))
}

function hasUikitAncestor(object) {
  let current = object?.parent
  while (current) {
    if (isUikitObject(current)) return true
    current = current.parent
  }
  return false
}

function collectUikitComponents(scene) {
  const components = new Map()
  scene.traverse((object) => {
    if (!isUikitObject(object)) return
    if (hasUikitAncestor(object)) return
    components.set(object.uuid ?? object.id ?? components.size, object)
  })
  return Array.from(components.values())
}

function isVisibleObject(object) {
  let current = object
  while (current) {
    if (current.visible === false) return false
    const displayed = signalValue(current.displayed)
    const isVisible = signalValue(current.isVisible)
    if (displayed === false || isVisible === false) return false
    current = current.parent
  }
  return true
}

function getSize(object) {
  const root = signalValue(object.root)
  const size = firstDefined(signalValue(object.size), signalValue(root?.size))
  if (Array.isArray(size) && size.length >= 2) {
    const width = Number(size[0])
    const height = Number(size[1])
    return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null
  }
  if (size && typeof size === 'object') {
    const width = Number(firstDefined(size.width, size.x, size[0]))
    const height = Number(firstDefined(size.height, size.y, size[1]))
    return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null
  }
  return null
}

function getPixelSize(object) {
  const root = signalValue(object.root)
  const properties = firstDefined(signalValue(object.properties), signalValue(root?.properties), {})
  const pixelSize = Number(firstDefined(signalValue(properties?.pixelSize), properties?.pixelSize, 0.01))
  return Number.isFinite(pixelSize) && pixelSize > 0 ? pixelSize : 0.01
}

const worldPosition = new Vector3()
const worldScale = new Vector3()
const worldQuaternion = new Quaternion()

function getSizeUnitScale(object) {
  object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale)
  const externalScale = Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Number.EPSILON)
  return externalScale < 0.05 ? 1 : getPixelSize(object)
}

function getWorldCorners(object) {
  object.updateMatrixWorld?.(true)
  try {
    const box = new Box3().setFromObject(object)
    if (!box.isEmpty()) {
      const min = box.min
      const max = box.max
      if (
        Number.isFinite(min.x) &&
        Number.isFinite(min.y) &&
        Number.isFinite(min.z) &&
        Number.isFinite(max.x) &&
        Number.isFinite(max.y) &&
        Number.isFinite(max.z)
      ) {
        return [
          new Vector3(min.x, min.y, min.z),
          new Vector3(max.x, min.y, min.z),
          new Vector3(min.x, max.y, min.z),
          new Vector3(max.x, max.y, min.z),
          new Vector3(min.x, min.y, max.z),
          new Vector3(max.x, min.y, max.z),
          new Vector3(min.x, max.y, max.z),
          new Vector3(max.x, max.y, max.z),
        ]
      }
    }
  } catch {
    // Some uikit internals expose non-geometry Object3Ds that make Box3 traversal throw.
    // Fall through to the explicit uikit size/pixel-size projection path below.
  }

  const size = getSize(object)
  if (size != null && size.width > 0 && size.height > 0) {
    const unitScale = getSizeUnitScale(object)
    const width = size.width * unitScale
    const height = size.height * unitScale
    return [
      new Vector3(-width / 2, -height / 2, 0),
      new Vector3(width / 2, -height / 2, 0),
      new Vector3(width / 2, height / 2, 0),
      new Vector3(-width / 2, height / 2, 0),
    ].map((point) => point.applyMatrix4(object.matrixWorld))
  }

  return []
}

function cross2d(origin, a, b) {
  if (origin == null || a == null || b == null) return 0
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
}

function convexHull(points) {
  const sorted = points
    .filter((point) => point != null && Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  if (sorted.length <= 3) return sorted
  const lower = []
  for (const point of sorted) {
    while (lower.length >= 2 && cross2d(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
    lower.push(point)
  }
  const upper = []
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (upper.length >= 2 && cross2d(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
    upper.push(point)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function getProjectionCamera(debug) {
  const baseCamera = debug.camera
  const xr = debug.gl?.xr
  let camera = baseCamera
  if (xr?.isPresenting && typeof xr.getCamera === 'function') {
    try {
      camera = xr.getCamera(baseCamera)
    } catch {
      camera = baseCamera
    }
  }
  return Array.isArray(camera?.cameras) && camera.cameras.length > 0 ? camera.cameras[0] : camera
}

function projectRootShape(object, camera) {
  const corners = getWorldCorners(object)
  if (corners.length === 0) return null

  camera.updateMatrixWorld?.(true)
  camera.updateProjectionMatrix?.()

  const projected = []
  for (const point of corners) {
    const cameraSpace = point.clone().applyMatrix4(camera.matrixWorldInverse)
    if (!Number.isFinite(cameraSpace.z) || cameraSpace.z >= -0.01) return null
    const ndc = point.clone().project(camera)
    if (Number.isFinite(ndc.x) && Number.isFinite(ndc.y) && Number.isFinite(ndc.z)) projected.push(ndc)
  }
  if (projected.length === 0) return null

  const points = convexHull(projected.map((point) => ({ x: point.x, y: point.y })))
  if (points.length < 3) return null

  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const x0 = clampNumber(minX, -1, 1)
  const x1 = clampNumber(maxX, -1, 1)
  const y0 = clampNumber(minY, -1, 1)
  const y1 = clampNumber(maxY, -1, 1)
  if (x1 <= x0 || y1 <= y0) return null
  return {
    label: object.name || object.type || 'uikit-root',
    x0,
    x1,
    y0,
    y1,
    points,
  }
}

function pointInPolygon(x, y, points) {
  let inside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const currentPoint = points[index]
    const previousPoint = points[previous]
    if (currentPoint == null || previousPoint == null) continue
    const crossesY = currentPoint.y > y !== previousPoint.y > y
    if (!crossesY) continue
    const intersectionX = ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) / (previousPoint.y - currentPoint.y || Number.EPSILON) + currentPoint.x
    if (x < intersectionX) inside = !inside
  }
  return inside
}

function getCoverage(shapes) {
  const occupied = new Uint8Array(GRID_COLUMNS * GRID_ROWS)
  for (const shape of shapes) {
    if (!Array.isArray(shape?.points) || shape.points.length < 3) continue
    for (let row = 0; row < GRID_ROWS; row += 1) {
      const y = -1 + ((row + 0.5) / GRID_ROWS) * 2
      if (y < shape.y0 || y > shape.y1) continue
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = -1 + ((column + 0.5) / GRID_COLUMNS) * 2
        if (x < shape.x0 || x > shape.x1) continue
        if (pointInPolygon(x, y, shape.points)) occupied[row * GRID_COLUMNS + column] = 1
      }
    }
  }
  let count = 0
  for (const value of occupied) count += value
  return count / occupied.length
}

function sampleUikitCoverage(reason) {
  try {
    const debug = getDebugState()
    if (!debug?.scene || !debug?.camera) {
      missingGlobalSamples += 1
      return
    }

    const scene = debug.scene
    const camera = getProjectionCamera(debug)
    scene.updateMatrixWorld?.(true)
    const components = collectUikitComponents(scene).filter(isVisibleObject)
    const shapes = []
    for (const component of components) {
      try {
        const shape = projectRootShape(component, camera)
        if (shape != null) shapes.push(shape)
      } catch (error) {
        coverageErrors.push({
          reason: 'root',
          elapsedMs: Math.round(performance.now() - startedAt),
          label: component?.name || component?.type || 'uikit-root',
          message: String(error?.message ?? error),
        })
      }
    }
    const coverage = getCoverage(shapes)
    const rootCoverages = shapes.map((shape) => getCoverage([shape]))
    const maxRootCoverage = rootCoverages.length === 0 ? 0 : Math.max(...rootCoverages)
    samples.push({
      reason,
      elapsedMs: Math.round(performance.now() - startedAt),
      rootCount: components.length,
      rectCount: shapes.length,
      coverage: round(coverage),
      maxRootCoverage: round(maxRootCoverage),
      rects: shapes.slice(0, 8).map((shape, index) => ({
        label: shape.label,
        x0: round(shape.x0),
        x1: round(shape.x1),
        y0: round(shape.y0),
        y1: round(shape.y1),
        area: round(rootCoverages[index] ?? 0),
      })),
    })
  } catch (error) {
    coverageErrors.push({
      reason,
      elapsedMs: Math.round(performance.now() - startedAt),
      message: String(error?.message ?? error),
    })
  }
}

const timer = setInterval(() => sampleUikitCoverage('interval'), SAMPLE_INTERVAL_MS)
try {
  await import('/vitexec/play.ts')
} catch (error) {
  playError = error
} finally {
  await delay(500)
  sampleUikitCoverage('final')
  clearInterval(timer)
}

const usableSamples = samples.filter((sample) => sample.rootCount > 0)
const highCoverageSamples = usableSamples.filter((sample) => sample.coverage > 0.3)
const summary = {
  sampleCount: samples.length,
  usableSampleCount: usableSamples.length,
  missingGlobalSamples,
  maxRootCount: samples.reduce((max, sample) => Math.max(max, sample.rootCount), 0),
  maxCoverage: round(samples.reduce((max, sample) => Math.max(max, sample.coverage), 0)),
  averageCoverage: round(usableSamples.reduce((sum, sample) => sum + sample.coverage, 0) / Math.max(1, usableSamples.length)),
  highCoverageRatio: round(highCoverageSamples.length / Math.max(1, usableSamples.length)),
  threshold: { coverage: 0.3, timeRatio: 0.4 },
  coverageErrors,
  samples,
}
console.log('milestone:ui-coverage-summary ' + JSON.stringify(summary))

if (playError != null) throw playError
`

async function getVideoVisualEvidenceIssue(videoPath, runDir, duration) {
  if (duration == null || duration <= 0) return null
  const frameMetrics = await sampleVideoFrameMetrics(videoPath, runDir, duration)
  if (frameMetrics == null || frameMetrics.length < 4) return null

  const whiteFrames = frameMetrics.filter((metric) => metric.whiteRatio > 0.78 || (metric.mean > 238 && metric.stdDev < 28))
  const flatFrames = frameMetrics.filter(
    (metric) => metric.stdDev < 2 || metric.dominantBucketRatio > 0.985 || (metric.edgeEnergy < 0.08 && metric.stdDev < 6),
  )
  const centerBlankFrames = frameMetrics.filter(
    (metric) =>
      metric.centerStdDev < 2 ||
      (metric.centerEdgeEnergy < 0.08 && metric.centerStdDev < 8) ||
      (metric.centerMean > 226 && metric.centerStdDev < 12 && metric.centerEdgeEnergy < 0.2),
  )
  const deltas = []
  for (let index = 1; index < frameMetrics.length; index += 1) {
    deltas.push(frameMetrics[index].diffFromPrevious)
  }
  const averageDelta = mean(deltas)
  const maxDelta = Math.max(...deltas)
  const lowMotionPairs = deltas.filter((delta) => delta < 1.5).length
  const whiteFrameRatio = whiteFrames.length / frameMetrics.length
  const flatFrameRatio = flatFrames.length / frameMetrics.length
  const centerBlankFrameRatio = centerBlankFrames.length / frameMetrics.length
  const lowMotionPairRatio = deltas.length === 0 ? 0 : lowMotionPairs / deltas.length

  const summary = {
    frameCount: frameMetrics.length,
    whiteFrameRatio: roundMetric(whiteFrameRatio),
    flatFrameRatio: roundMetric(flatFrameRatio),
    centerBlankFrameRatio: roundMetric(centerBlankFrameRatio),
    lowMotionPairRatio: roundMetric(lowMotionPairRatio),
    averageFrameDelta: roundMetric(averageDelta),
    maxFrameDelta: roundMetric(maxDelta),
  }
  await writeRunFile(runDir, 'video-visual-metrics.json', `${JSON.stringify({ summary, frames: frameMetrics }, null, 2)}\n`)

  if (whiteFrameRatio >= 0.45) {
    return `Too many sampled frames are mostly white/blank (${Math.round(whiteFrameRatio * 100)}%). Check viewer orientation, AR clear color, camera-facing panels, and whether the headset is pointed at the scene. Metrics: ${JSON.stringify(summary)}`
  }
  if (flatFrameRatio >= 0.45) {
    return `Too many sampled frames are flat/single-color (${Math.round(flatFrameRatio * 100)}%). This usually means the headset is pointed at a blank background or the scene disappeared from the recording. Metrics: ${JSON.stringify(summary)}`
  }
  if (centerBlankFrameRatio >= 0.55) {
    return `The center of the recorded view is blank or nearly textureless for most samples (${Math.round(centerBlankFrameRatio * 100)}%). Keep the active world object, target, or product in the center of the headset view. Metrics: ${JSON.stringify(summary)}`
  }
  if (frameMetrics.length >= 6 && averageDelta < 1.25 && maxDelta < 4.5) {
    return `Sampled frames show almost no visual movement or state change. Move/turn the headset between stations and keep animated/interacted objects visible. Metrics: ${JSON.stringify(summary)}`
  }
  if (frameMetrics.length >= 6 && lowMotionPairRatio >= 0.7 && maxDelta < 12) {
    return `The recording is visually static for nearly the whole walkthrough despite logged milestones. Metrics: ${JSON.stringify(summary)}`
  }
  return null
}

async function sampleVideoFrameMetrics(videoPath, runDir, duration) {
  const sampleCount = Number(process.env.EVAL_VIDEO_SAMPLE_COUNT ?? 9)
  const width = Number(process.env.EVAL_VIDEO_SAMPLE_WIDTH ?? 96)
  const height = Number(process.env.EVAL_VIDEO_SAMPLE_HEIGHT ?? 54)
  const start = Math.min(Math.max(1, duration * 0.08), Math.max(0, duration - 0.1))
  const end = Math.max(start, duration * 0.92)
  const times = Array.from({ length: sampleCount }, (_, index) => {
    const t = sampleCount === 1 ? duration / 2 : start + ((end - start) * index) / (sampleCount - 1)
    return clamp(t, 0, Math.max(0, duration - 0.05))
  })
  const framesDir = path.join(runDir, 'video-sample-frames')
  await mkdir(framesDir, { recursive: true })

  const frames = []
  for (let index = 0; index < times.length; index += 1) {
    try {
      const frame = await readScaledVideoFrame(videoPath, times[index], width, height)
      await writeFile(path.join(framesDir, `sample-${String(index + 1).padStart(2, '0')}.rgb`), frame)
      frames.push(frame)
    } catch {
      log('ffmpeg unavailable or video sample extraction failed; skipping video visual evidence check')
      return null
    }
  }

  return frames.map((frame, index) => {
    const metrics = getRgbFrameMetrics(frame, width, height)
    return {
      index: index + 1,
      timeSeconds: roundMetric(times[index]),
      ...metrics,
      diffFromPrevious: index === 0 ? 0 : roundMetric(getMeanFrameDiff(frames[index - 1], frame)),
    }
  })
}

async function readScaledVideoFrame(videoPath, seconds, width, height) {
  const { stdout } = await execFileAsync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-ss',
      seconds.toFixed(3),
      '-i',
      videoPath,
      '-frames:v',
      '1',
      '-vf',
      `scale=${width}:${height}:flags=area,format=rgb24`,
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    { encoding: 'buffer', timeout: 30_000, maxBuffer: width * height * 3 + 1024 },
  )
  const expected = width * height * 3
  if (!Buffer.isBuffer(stdout) || stdout.length < expected) throw new Error('short raw frame')
  return stdout.subarray(0, expected)
}

function getRgbFrameMetrics(frame, width, height) {
  const pixelCount = width * height
  let sum = 0
  let sumSq = 0
  let white = 0
  let saturated = 0
  const buckets = new Map()
  const centerX0 = Math.floor(width * 0.2)
  const centerX1 = Math.ceil(width * 0.8)
  const centerY0 = Math.floor(height * 0.2)
  const centerY1 = Math.ceil(height * 0.8)
  let centerSum = 0
  let centerSumSq = 0
  let centerCount = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3
      const r = frame[offset]
      const g = frame[offset + 1]
      const b = frame[offset + 2]
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      sum += luma
      sumSq += luma * luma
      if (r > 242 && g > 242 && b > 242) white += 1
      if (Math.max(r, g, b) - Math.min(r, g, b) > 80) saturated += 1
      const bucket = `${r >> 5},${g >> 5},${b >> 5}`
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
      if (x >= centerX0 && x < centerX1 && y >= centerY0 && y < centerY1) {
        centerSum += luma
        centerSumSq += luma * luma
        centerCount += 1
      }
    }
  }

  const frameMean = sum / pixelCount
  const centerMean = centerCount === 0 ? 0 : centerSum / centerCount
  const dominantBucket = Math.max(...buckets.values())
  return {
    mean: roundMetric(frameMean),
    stdDev: roundMetric(Math.sqrt(Math.max(0, sumSq / pixelCount - frameMean * frameMean))),
    whiteRatio: roundMetric(white / pixelCount),
    saturatedRatio: roundMetric(saturated / pixelCount),
    dominantBucketRatio: roundMetric(dominantBucket / pixelCount),
    edgeEnergy: roundMetric(getEdgeEnergy(frame, width, height, 0, width, 0, height)),
    centerMean: roundMetric(centerMean),
    centerStdDev: roundMetric(Math.sqrt(Math.max(0, centerSumSq / Math.max(1, centerCount) - centerMean * centerMean))),
    centerEdgeEnergy: roundMetric(getEdgeEnergy(frame, width, height, centerX0, centerX1, centerY0, centerY1)),
  }
}

function getEdgeEnergy(frame, width, height, x0, x1, y0, y1) {
  let total = 0
  let count = 0
  for (let y = Math.max(1, y0); y < Math.min(height, y1); y += 1) {
    for (let x = Math.max(1, x0); x < Math.min(width, x1); x += 1) {
      const offset = (y * width + x) * 3
      const left = offset - 3
      const up = offset - width * 3
      const luma = getLuma(frame, offset)
      total += Math.abs(luma - getLuma(frame, left)) + Math.abs(luma - getLuma(frame, up))
      count += 2
    }
  }
  return count === 0 ? 0 : total / count
}

function getLuma(frame, offset) {
  return 0.2126 * frame[offset] + 0.7152 * frame[offset + 1] + 0.0722 * frame[offset + 2]
}

function getMeanFrameDiff(left, right) {
  const length = Math.min(left.length, right.length)
  let total = 0
  for (let index = 0; index < length; index += 1) {
    total += Math.abs(left[index] - right[index])
  }
  return length === 0 ? 0 : total / length
}

function mean(values) {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length
}

function roundMetric(value) {
  return Number(value.toFixed(3))
}

function envNumber(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) ? value : fallback
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}

function getViewCheckElapsedSeconds(check, duration) {
  const rawMs = firstFiniteNumber(check.elapsedMs, check.elapsed, check.timeMs, check.timestampMs, check.t)
  if (rawMs != null) return clamp(rawMs / 1000, 0, Math.max(0, (duration ?? rawMs / 1000) - 0.05))
  const rawSeconds = firstFiniteNumber(check.elapsedSeconds, check.timeSeconds, check.seconds)
  if (rawSeconds != null) return clamp(rawSeconds, 0, Math.max(0, (duration ?? rawSeconds) - 0.05))
  return null
}

function sanitizeFilename(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'station'
}

function formatCodexEvent(line) {
  try {
    const event = JSON.parse(line)
    const item = event.item
    if (event.type === 'item.started' && item?.type === 'command_execution') return `tool: Run ${item.command}`
    if (event.type === 'item.completed' && item?.type === 'command_execution') {
      const output = item.aggregated_output?.trim()
      const result = `tool result: ${item.status ?? 'completed'} exit ${item.exit_code ?? 'unknown'}`
      return output ? `${result}\noutput:\n${truncate(output, 1200)}` : result
    }
    if (event.type === 'item.completed' && item?.type === 'agent_message' && item.text) return `agent: ${truncate(item.text, 1000)}`
    if (event.type === 'item.started' && item?.type === 'file_change') return 'file change: started'
    if (event.type === 'item.completed' && item?.type === 'file_change') return 'file change: completed'
    if (event.type === 'error' && event.message) return `error: ${truncate(event.message, 1000)}`
    if (event.type === 'turn.failed') {
      const message = event.error?.message ?? event.message ?? JSON.stringify(event.error ?? event)
      return `turn failed: ${truncate(message, 1000)}`
    }
    if (event.type === 'turn.completed') return `turn: completed ${truncate(JSON.stringify(event.usage ?? {}), 500)}`
  } catch {
    return `jsonl: ${truncate(line, 1000)}`
  }
  return null
}

function streamCodexEvent(label, entry) {
  if (process.env.EVAL_STREAM_HISTORY === '0') return
  log(`${label}: ${truncate(entry.replace(/\s+/g, ' ').trim(), 700)}`)
}

function getCodexEventCommand(line) {
  try {
    const event = JSON.parse(line)
    return event.type === 'item.started' && event.item?.type === 'command_execution' ? event.item.command : null
  } catch {
    return null
  }
}

function isDevServerCommand(command) {
  return (
    /\b(pnpm|npm|yarn)\s+(run\s+)?dev\b/.test(command) ||
    /(?:^|\s|["'])(?:\.\/node_modules\/\.bin\/|node_modules\/\.bin\/)?vite(?:\s+(?:dev\b|--host\b|--port\b|--open\b)|\s*(?:$|&&|;))/.test(
      command,
    )
  )
}

function getForbiddenCommandIssue(command) {
  if (/(?:^|\s)(?:cat|tee|sed|awk|perl|python|node)?[\s\S]*<<-?\s*['"]?\w+/m.test(command)) {
    return 'Agent tried to create or edit files with a shell heredoc; use patch/file-edit operations so JSX/TS strings are not corrupted.'
  }

  for (const absolutePath of getAbsolutePaths(command)) {
    const normalized = normalizeAbsolutePath(absolutePath)
    if (isAllowedAbsolutePath(normalized)) continue
    if (isAllowedVitexecBrowserPath(command, normalized)) continue
    return `Agent tried to inspect outside the generated workspace: ${absolutePath}`
  }
  return null
}

function getAbsolutePaths(command) {
  return [...command.matchAll(/(?:^|[\s"'`=])((?:\/private)?\/[^\s"'`;&|)<>]+)/g)].map((match) => match[1])
}

function isAllowedAbsolutePath(filePath) {
  return (
    filePath === CONTAINER_WORKSPACE ||
    filePath.startsWith(`${CONTAINER_WORKSPACE}/`) ||
    filePath.startsWith('/src/') ||
    filePath.startsWith('/node_modules/') ||
    filePath.startsWith('/bin/') ||
    filePath.startsWith('/dev/') ||
    filePath === '/tmp' ||
    filePath.startsWith('/tmp') ||
    filePath.startsWith('/usr/bin/') ||
    filePath.startsWith('/usr/local/bin/')
  )
}

function isAllowedVitexecBrowserPath(command, filePath) {
  return (
    /\bvitexec\b/.test(command) &&
    (
      isVitexecPathArgument(command, filePath) ||
      filePath === '/' ||
      filePath.startsWith('/vitexec/') ||
      filePath.startsWith('/assets/')
    )
  )
}

function isVitexecPathArgument(command, filePath) {
  const escaped = escapeRegExp(filePath)
  return new RegExp(`(?:^|\\s)--path(?:\\s+|=)['"]?${escaped}(?:['"]?(?:\\s|$))`).test(command)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeAbsolutePath(filePath) {
  return filePath.startsWith('/var/') ? `/private${filePath}` : filePath
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

async function isNonEmptyFile(filePath) {
  try {
    const file = await stat(filePath)
    return file.isFile() && file.size > 0
  } catch {
    return false
  }
}

async function writeRunFile(runDir, filename, content) {
  await mkdir(runDir, { recursive: true })
  await writeFile(path.join(runDir, filename), content)
}

async function appendHistory(filePath, entry) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${entry}\n\n`, { flag: 'a' })
}

async function readOptionalText(filePath) {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

async function getProjectWalkthroughScript(appDir) {
  try {
    const scripts = await getProjectScripts(appDir)
    for (const scriptName of ['walkthrough:xr', 'test:xr', 'walkthrough']) {
      const command = scripts[scriptName]
      if (typeof command === 'string' && /\bvitexec\b/.test(command) && /\b(iwer|xr|webxr|headset|controller|trigger)\b/i.test(command)) {
        return scriptName
      }
    }
  } catch {
    return null
  }
  return null
}

async function getProjectScript(appDir, names) {
  try {
    const scripts = await getProjectScripts(appDir)
    return names.find((name) => typeof scripts[name] === 'string') ?? null
  } catch {
    return null
  }
}

async function getProjectScripts(appDir) {
  const packageJson = JSON.parse(await readFile(path.join(appDir, 'package.json'), 'utf8'))
  return packageJson?.scripts ?? {}
}

async function findLatestWebm(rootDir) {
  const ignored = new Set(['node_modules', '.git', 'dist', 'build'])
  let latest = null

  async function visit(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const filePath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) await visit(filePath)
      } else if (entry.isFile() && entry.name.endsWith('.webm')) {
        const info = await stat(filePath)
        if (info.size > 0 && (latest == null || info.mtimeMs > latest.mtimeMs)) {
          latest = { filePath, mtimeMs: info.mtimeMs }
        }
      }
    }
  }

  await visit(rootDir)
  return latest?.filePath
}

function commandErrorResult(error) {
  return {
    stdout: readErrorOutput(error, 'stdout'),
    stderr: readErrorOutput(error, 'stderr') || (error instanceof Error ? error.message : String(error)),
    exitCode: typeof error?.code === 'number' ? Number(error.code) : 1,
  }
}

function readErrorOutput(error, key) {
  const value = error?.[key]
  return typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('utf8') : ''
}

function getVitexecLogIssue(result) {
  const combined = `${result.stdout}\n${result.stderr}`
  const hasFinalXrProof = hasSuccessfulXrWalkthroughProof(combined)
  const lines = combined
    .split(/\r?\n/)
    .filter((line) => /^\[(?:page error|error|request failed|navigation)\]/.test(line.trim()))
    .filter((line) => !/\[page error\] Cannot read properties of undefined \(reading 'prototype'\)/.test(line.trim()))
    .filter((line) => {
      const text = line.trim()
      if (hasFinalXrProof && /^\[error\]\s+An active XRSession already exists\./.test(text)) return false
      return true
    })
  return lines.length > 0 ? truncate(lines.join('\n'), 3000) : null
}

function getVitexecXrRuntimeIssue(result) {
  const combined = `${result.stdout}\n${result.stderr}`
  const hasActiveSession =
    /\b(milestone:)?xr\b[\s\S]{0,1000}\b(active|activeSession|inSession|isPresenting)\b[\s\S]{0,200}\btrue\b/i.test(combined) ||
    /\b(active|activeSession|inSession|isPresenting)\b[\s\S]{0,200}\btrue\b[\s\S]{0,1000}\b(milestone:)?xr\b/i.test(combined)
  const hasControllerInput = /\b(controller|trigger|select|squeeze)\b/i.test(combined)
  const viewerMoveMatches = combined.match(/\bmilestone:(?:viewer(?:-move)?|headset(?:-move)?|walk|approach|move)[^\n]*/gi) ?? []
  const hasViewerMovement = viewerMoveMatches.length >= 2 && viewerMoveMatches.some((line) => /position|station|target|viewer|headset|["']x["']|["']z["']/i.test(line))

  if (!hasActiveSession) {
    return truncate('Expected vitexec logs to include runtime proof of an active XR session, such as `milestone:xr {"activeSession":true}`.', 3000)
  }
  if (!hasControllerInput) {
    return truncate('Expected vitexec logs to include controller/select input evidence from the emulated XR walkthrough.', 3000)
  }
  if (!hasViewerMovement) {
    return truncate('Expected vitexec logs to include at least two viewer/headset movement milestones with positions or station names, so the recording proves the trainee moves through the XR space.', 3000)
  }
  return null
}

function getVitexecViewCompositionIssue(result) {
  const combined = `${result.stdout}\n${result.stderr}`
  const checks = parseViewChecks(combined)
  if (checks.length < 3) {
    return truncate('Expected at least three `milestone:view-check` logs with realistic viewer/target composition before key selections.', 3000)
  }

  const bad = []
  for (const [index, check] of checks.entries()) {
    const label = check.station ?? check.stationName ?? check.label ?? `view-check-${index + 1}`
    const distance = firstFiniteNumber(
      check.distanceMeters,
      check.distanceM,
      check.distance,
      check.targetDistance,
      check.distanceToTarget,
    )
    const headHeight = firstFiniteNumber(check.headHeight, check.viewerHeight, check.viewerY, check.viewerPosition?.y, check.viewer?.y, check.position?.y)
    const inFrame = firstBoolean(check.targetInFrame, check.inFrame, check.visible, check.framed)
    const coverage = firstFiniteNumber(check.coverage, check.screenCoverage, check.projectedCoverage, check.bounds?.coverage)

    if (distance == null) {
      bad.push(`${label}: missing distanceMeters`)
    } else if (distance < 0.9) {
      bad.push(`${label}: viewer too close to target (${distance.toFixed(2)}m)`)
    } else if (distance > 4.5) {
      bad.push(`${label}: viewer too far from target (${distance.toFixed(2)}m)`)
    }

    if (headHeight != null && (headHeight < 1.2 || headHeight > 2.1)) {
      bad.push(`${label}: implausible headset height (${headHeight.toFixed(2)}m)`)
    }
    if (inFrame === false) {
      bad.push(`${label}: target is not in frame`)
    }
    if (coverage != null && coverage > 0.7) {
      bad.push(`${label}: target likely fills too much of the frame (${coverage.toFixed(2)})`)
    }
  }

  return bad.length > 0 ? truncate(bad.join('\n'), 3000) : null
}

function parseViewChecks(text) {
  const checks = []
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/milestone:view-check\s+(\{.*\})/)
    if (match == null) continue
    try {
      checks.push(JSON.parse(match[1]))
    } catch {
      checks.push({ station: 'unparseable', raw: match[1] })
    }
  }
  return checks
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (Number.isFinite(number)) return number
  }
  return null
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return null
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function hasSuccessfulXrWalkthroughProof(text) {
  const hasActiveSession =
    /\b(milestone:)?xr(?:-session)?\b[\s\S]{0,1000}\b(activeSession|active|inSession|isPresenting)\b[\s\S]{0,200}\btrue\b/i.test(text) ||
    /\b(activeSession|active|inSession|isPresenting)\b[\s\S]{0,200}\btrue\b[\s\S]{0,1000}\b(milestone:)?xr(?:-session)?\b/i.test(text)
  const hasVisualEvidence =
    /\bmilestone:visual-evidence\b[\s\S]{0,1000}\b(activeSession|active|inSession|isPresenting)\b[\s\S]{0,200}\btrue\b/i.test(text)
  const hasCompletedFlow =
    /\bmilestone:(?:selected:report|final-report|complete|completed)\b[\s\S]{0,1000}\b(?:passed|pass|complete|completed|currentStep)\b[\s\S]{0,300}\b(?:true|"complete"|"completed")\b/i.test(
      text,
    )
  const hasViewerMovement = (text.match(/\bmilestone:(?:viewer|headset|walk|approach|move)[^\n]*/gi) ?? []).length >= 2

  return hasActiveSession && hasVisualEvidence && hasCompletedFlow && hasViewerMovement
}

function getAgentReviewIssue(review) {
  return /^\s*FAIL\b/i.test(review) ? truncate(review, 3000) : null
}

function historyForReview(history) {
  if (history.length <= 40_000) return history
  return `${history.slice(0, 12_000)}

...<middle of long history omitted>...

${history.slice(-28_000)}`
}

async function closeStream(stream) {
  await new Promise((resolve, reject) => {
    stream.once('error', reject)
    stream.once('finish', resolve)
    stream.end()
  })
}

function stopWithIssue(message) {
  console.log(`[pmndrs-xr-eval] Issue: ${message}`)
  process.exitCode = 1
}

function truncate(value, max) {
  return value.length <= max ? value : `${value.slice(0, max)}\n...<truncated>`
}

function formatDuration(ms) {
  return `${Math.round(ms / 1000)}s`
}

function log(message) {
  console.log(`[pmndrs-xr-eval] ${message}`)
}

await main()

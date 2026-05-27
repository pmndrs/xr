---
name: vitexec
description: Use this skill when an AI agent needs to inspect, verify, or debug a live Vite app by running temporary snippets inside the browser page and reading browser logs. Use for client state after interactions, imported app modules, DOM state, human-like input, canvas/WebGL/Three.js state, screenshots, videos, WebXR/Three.js XR with IWER, and runtime-only behavior without editing app files.
---

# vitexec

Use `vitexec` when the truth lives in the running browser: client state, imported app modules, DOM, canvas/WebGL, screenshots, recordings, or browser-only errors.

Do not use it for questions static files, unit tests, or TypeScript can answer directly.

## References

- If `vitexec` or Playwright is missing, read [references/install.md](references/install.md).
- For mouse, keyboard, pointer lock, gamepad, or other input, read [references/inputs.md](references/inputs.md).
- For WebXR, read [references/webxr.md](references/webxr.md).

## Workflow

1. Identify the page path if it is not `/`.
2. Write the smallest snippet that performs the user-like action or reads the browser-only state.
3. Run `vitexec '<snippet>'`, adding `--path`, `--gpu`, `--screenshot`, `--record`, or `--config` only when needed.
4. Treat stdout as browser logs. It starts with `logs:`.

```sh
vitexec 'console.log("ready")'
```

For structured state, log JSON:

```sh
vitexec --path /cart '
  import { useCartStore } from "/src/store/cart.ts";
  document.querySelector("[data-testid=add-to-cart]")?.click();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  console.log("cart", JSON.stringify(useCartStore.getState()));
'
```

## Guidance

- Prefer importing exported app state over scraping DOM when state is available.
- Use direct state reads for observation and assertions, not to bypass user interaction.
- Prefer browser-root imports such as `/src/store.ts`, not local filesystem paths.
- Use `--gpu` for WebGL, canvas, Three.js, and WebXR behavior.
- For WebXR apps, read `references/webxr.md`; the passing proof should enter an emulated XR session, not only a desktop fallback.
- For CI-style XR proof, wrap or post-process vitexec output when needed so missing milestones, browser/page errors, and missing screenshots/recordings fail even if the CLI exits 0.
- Use screenshots or recordings only when visual evidence matters.
- Do not leave temporary code in the app when `vitexec` can inspect it from outside.

# Dependencies And Versions

## Package Compatibility

- Use versions that resolve in the selected package manager/registry.
- If install fails on an assumed version, query available versions and pin a published one before continuing.
- Keep Vite and `@vitejs/plugin-react` peers aligned. Current `@vitejs/plugin-react` 6.x expects Vite 8.x; do not pair it with Vite 7.x.
- Current `@react-three/drei` 10.x expects React/React DOM 19.x and `@react-three/fiber` 9.x. Do not combine drei 10 with React 18 or fiber 8.
- If a demo does not need drei helpers, omit `@react-three/drei`.
- `@react-three/xr` 6.x accepts `@react-three/fiber >=8`, React `>=18`, and Three `*`, but companion packages may have stricter peers.
- Strict TypeScript apps that import `three` or React DOM directly should include matching type packages such as `@types/three`, `@types/react`, and `@types/react-dom`.
- For WebXR/IWER validation, use a published `iwer` 2.x release. Registry checks during eval work found `iwer@2.2.1` available and `iwer@1.9.x` unavailable.
- `vitexec` must be available locally when package scripts call it.

## Code Generation

- Do not generate JSX, TypeScript, HTML, or vitexec files through shell heredocs such as `cat <<EOF`, `cat > file <<EOF`, or `tee <<EOF`.
- Use patch/file-edit operations; heredocs routinely corrupt nested quotes, JSX self-closing tags, HTML doctype syntax, and JavaScript template strings.

## Generated Scratch Apps

- Do not run git commands inside generated scratch apps unless you confirm they are git repositories.
- Do not leave a Vite/dev preview server running after validation.
- Prefer `npm run build` or the project’s focused validation scripts before final summary.

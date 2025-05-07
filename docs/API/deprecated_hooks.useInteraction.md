---
title: useInteraction
nav: 33
sourcecode: packages/react/xr/src/deprecated/hooks.tsx
---

> [!CAUTION]
> Deprecated: Use normal react-three/fiber event listeners instead (e.g. `<mesh onClick={...} />`)

> **useInteraction**(`ref`, `type`, `handler?`): `void`

## Parameters

### ref

`RefObject`\<`null` \| `Group`\<`Object3DEventMap`\>\>

### type

`"onBlur"` | `"onSelect"` | `"onHover"` | `"onMove"` | `"onSelectEnd"` | `"onSelectStart"` | `"onSqueeze"` | `"onSqueezeEnd"` | `"onSqueezeStart"`

### handler?

(`event`) => `void`

## Returns

`void`


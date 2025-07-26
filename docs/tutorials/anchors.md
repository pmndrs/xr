---
title: Anchors
description: How to create and manage anchors in your AR experience?
nav: 18
---

Anchors allow to anchor virtual objects into the physical world in AR experiences. `react-three/xr` offers a multitude of ways to create and manage anchors. A simple solution is `useXRAnchor`, which works similarly to `useState` as it returns the current anchor and a function to request a new anchor as a tuple.

```tsx
const [anchor, requestAnchor] = useXRAnchor()
```

With the `requestAnchor` function, we can request an anchor relative to the `"world"`, a `"space"`, or a `"hitTestResult"`

```tsx
requestAnchor({ relativeTo: "space", space: ... })
```

Once the anchor is created, the `useXRAnchor` hook exposes it as `anchor`. We can now use this `anchor` to put content into it using the `<XRSpace>` component.

```tsx
<XRSpace space={anchor.anchorSpace}>...your content</XRSpace>
```

The following example shows a `Anchor` component that uses the `useXRAnchor` hook and the `XRSpace` component to anchor a Box to the position of the right hand or controller when the respective hand or controller is selected (pinch/trigger).

```tsx
export function Anchor() {
  const [anchor, requestAnchor] = useXRAnchor()
  const controllerState = useXRInputSourceState('controller', 'right')
  const handState = useXRInputSourceState('hand', 'right')
  const inputSource = controllerState?.inputSource ?? handState?.inputSource
  useXRInputSourceEvent(
    inputSource,
    'select',
    async () => {
      if (inputSource == null) {
        return
      }
      requestAnchor({ relativeTo: 'space', space: inputSource.targetRaySpace })
    },
    [requestAnchor, inputSource],
  )
  if (anchor == null) {
    return null
  }
  return (
    <XRSpace space={anchor.anchorSpace}>
      <mesh scale={0.1}>
        <boxGeometry />
      </mesh>
    </XRSpace>
  )
}
```

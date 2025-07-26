---
title: Layers
description: How to use display images, videos, and custom renders at high quality on quad, cylinder, and equirect shapes?
nav: 16
---

Layers allow to render videos, images, and complete scenes with higher performance and higher quality while preserving battery life and latency for quad, cylinder, and equirect shapes using the WebXR Layer API. Layers are perfect for use cases that display flat, high-quality content, such as videos, images, and user interfaces. The following example illustrates how to create a layer that renders a video.

First, we create a layer at `0, 1.5, -0.5` with a scale of `0.5` that displays a video assigned to `src` and starts that video when clicked.

```tsx
<XRLayer position={[0, 1.5, -0.5]} onClick={() => video.play()} scale={0.5} src={video} />
```

The assigned video is an HTML video element that is loaded from `test.mp4`.

```tsx
const video = useMemo(() => {
  const result = document.createElement('video')
  result.src = 'test.mp4'
  return result
}, [])
```

Combined, the final app looks like this

```tsx
export function App() {
  const video = useMemo(() => {
    const result = document.createElement('video')
    result.src = 'test.mp4'
    return result
  }, [])
  return (
    <Canvas>
      <XR store={store}>
        <XRLayer position={[0, 1.5, -0.5]} onClick={() => video.play()} scale={0.5} src={video} />
      </XR>
    </Canvas>
  )
}
```

Instead of images and videos, Layers can also be used to display dynamically rendered content. The following example illustrates how to render a red cube onto the layer. This scene will be re-rendered every frame, allowing for fully dynamic content.

```tsx
<XRLayer position={[0, 1.5, -0.5]} scale={0.5}>
  <mesh>
    <boxGeometry />
    <meshBasicMaterial color="red" />
  </mesh>
</XRLayer>
```

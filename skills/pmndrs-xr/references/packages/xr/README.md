# @pmndrs/xr

# xr
Turn any threejs app into an interactive immersive experience.
<br/>

```bash
npm install three @pmndrs/xr
```

## What does it look like?

| A simple scene with a mesh that toggles its material color between `"red"` and `"blue"` when clicked through touching or pointing. | ![recording of interacting with the code below](../../docs/getting-started/basic-example.gif) |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |

```tsx
import { createXRStore } from '@pmndrs/xr'
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
const scene = new Scene()
const canvas = document.getElementById('root') as HTMLCanvasElement
const renderer = new WebGLRenderer({ antialias: true, canvas, alpha: true })

const boxMaterial = new MeshBasicMaterial({ color: 'red' })
const box = new Mesh(new BoxGeometry(), boxMaterial)
box.pointerEventsType = { deny: 'grab' }
let red = false
box.addEventListener('click', () => {
  red = !red
  boxMaterial.color.set(red ? 'red' : 'blue')
})
scene.add(box)

const store = createXRStore(canvas, scene, camera, renderer.xr)
document.getElementById('enter-ar')?.addEventListener('click', () => store.enterAR())

let prevTime: undefined | number

renderer.setAnimationLoop((time, frame) => {
  const delta = prevTime == null ? 0 : time - prevTime
  prevTime = time
  store.update(frame, delta)
  renderer.render(scene, camera)
})

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)
```

### How to enable XR for your threejs app?

1. `const store = createXRStore(canvas, scene, camera, renderer.xr)` create a xr store
2. `store.enterAR()` call enter AR when clicking on a button

## Tutorials

_The following tutorials contain code for react-three/fiber but all informations are also applicable for @pmndrs/xr._

- 👌 [Interactions](https://docs.pmnd.rs/xr/tutorials/interactions)
- 🔧 [Options](https://docs.pmnd.rs/xr/tutorials/options)
- 🧊 [Object Detection](https://docs.pmnd.rs/xr/tutorials/object-detection)
- ✴ [Origin](https://docs.pmnd.rs/xr/tutorials/origin)
- 🪄 [Teleport](https://docs.pmnd.rs/xr/tutorials/teleport)
- 🕹️ [Gamepad](https://docs.pmnd.rs/xr/tutorials/gamepad)
- 🎮 [Custom Controller/Hands/...](https://docs.pmnd.rs/xr/tutorials/custom-inputs)
- ⛨ [Guards](https://docs.pmnd.rs/xr/tutorials/guards)

## Roadmap

- 🤳 XR Gestures
- ➕ Multimodal
- ⚓️ Anchors
- 📺 Layers
- 📱 Dom Overlays
- 🕺 Tracked Body
- 🎯 Hit Test
- ↕ pmndrs/controls

## Sponsors

This project is supported by a few companies and individuals building cutting-edge 3D Web & XR experiences. Check them out!

![Sponsors Overview](https://bbohlender.github.io/sponsors/screenshot.png)

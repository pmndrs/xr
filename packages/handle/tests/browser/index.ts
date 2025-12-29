import { Scene, PerspectiveCamera, WebGLRenderer, GridHelper } from 'three'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { MapHandles, MapHandlesWheelOptions } from '../../src/screen/map.js'

// Parse wheel options from URL params
function getWheelOptionsFromURL(): MapHandlesWheelOptions | undefined {
  const params = new URLSearchParams(window.location.search)
  const options: MapHandlesWheelOptions = {}
  let hasOptions = false

  for (const key of ['zoom', 'yaw', 'pitch', 'pan'] as const) {
    const value = params.get(key)
    if (value !== null) {
      hasOptions = true
      options[key] = value === 'false' ? false : parseFloat(value)
    }
  }

  return hasOptions ? options : undefined
}

const scene = new Scene()
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 5, 5)
camera.lookAt(0, 0, 0)

const renderer = new WebGLRenderer({ antialias: true, canvas })
renderer.setSize(window.innerWidth, window.innerHeight)

// Setup pointer events forwarding
const { update: updatePointerEvents } = forwardHtmlEvents(canvas, () => camera, scene)

// Setup MapHandles with optional wheel config from URL
const wheelOptions = getWheelOptionsFromURL()
const mapHandles = new MapHandles(canvas, camera, undefined, wheelOptions)
const unbind = mapHandles.bind(scene)

// Add grid for visual reference
scene.add(new GridHelper(20, 20))

// Expose state for testing
declare global {
  interface Window {
    getState: () => {
      yaw: number
      pitch: number
      distance: number
      origin: readonly [number, number, number]
    }
  }
}

window.getState = () => {
  const state = mapHandles.getStore().getState()
  return {
    yaw: state.yaw,
    pitch: state.pitch,
    distance: state.distance,
    origin: state.origin,
  }
}

// Log state changes for debugging
mapHandles.getStore().subscribe((state) => {
  console.log(
    '[state]',
    JSON.stringify({
      yaw: state.yaw.toFixed(4),
      pitch: state.pitch.toFixed(4),
      distance: state.distance.toFixed(4),
      origin: state.origin.map((v) => v.toFixed(4)),
    }),
  )
})

renderer.setAnimationLoop((time) => {
  updatePointerEvents()
  mapHandles.update(16) // ~60fps delta
  renderer.render(scene, camera)
})

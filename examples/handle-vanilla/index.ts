import { BoxGeometry, Mesh, MeshBasicMaterial, Object3DEventMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { PointerEventsMap, forwardHtmlEvents } from '@pmndrs/pointer-events'
import { OrbitHandles, PivotHandles, TransformHandles, HandleStore } from '@pmndrs/handle'
import { createXRStore } from '@pmndrs/xr'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.set(0, 0, 2)

const scene = new Scene()

const pivot = new PivotHandles()
scene.add(pivot)
pivot.bind()

const box1 = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 'red' }),
)
pivot.add(box1)

const transform = new TransformHandles()
transform.rotation.y = Math.PI / 4
transform.position.z = -2
scene.add(transform)
transform.bind('scale')
transform.space = 'local'

const box2 = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 'blue' }),
)
transform.add(box2)

const box3 = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 'blue' }),
)
box3.position.set(1, 1, 1)
//providing the target object
const handleStore = new HandleStore(box3)
//binding to the handle object
handleStore.bind(box3)
scene.add(box3)

const canvas = document.getElementById('root') as HTMLCanvasElement

//orbit (controls)
const orbit = new OrbitHandles(canvas, camera)
orbit.bind(scene, true)

const { update: updateForwardHtmlEvents } = forwardHtmlEvents(canvas, () => camera, scene)

const renderer = new WebGLRenderer({ antialias: true, canvas })
renderer.xr.enabled = true

const store = createXRStore(canvas, scene, () => camera, renderer.xr, {
  emulate: false,
  /*since we already set it up seperately for demonstration purposes*/ htmlInput: false,
})

let prevTime: number | undefined
renderer.setAnimationLoop((time, frame) => {
  const deltaTime = prevTime == null ? 0 : time - prevTime
  prevTime = time
  updateForwardHtmlEvents()
  orbit.update(deltaTime)
  pivot.update(time, camera)
  transform.update(time, camera)
  handleStore.update(deltaTime)
  store.update(frame, deltaTime)
  renderer.render(scene, camera)
})

function updateSize() {
  const { width, height } = canvas.getBoundingClientRect()
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

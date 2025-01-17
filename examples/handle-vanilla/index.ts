import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { PointerEventsMap, forwardHtmlEvents } from '@pmndrs/pointer-events'
import { OrbitHandles, PivotHandles, RotateHandles, TransformHandles, TranslateHandles } from '@pmndrs/handle'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 2

const scene = new Scene()

const pivot = new PivotHandles()
scene.add(pivot)
pivot.bind()

const box1 = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 'red' }),
)
pivot.add(box1)

const x = new Group()
scene.add(x)

const transform = new TransformHandles()
transform.rotation.y = Math.PI / 4
transform.position.z = -2
x.add(transform)
transform.bind('translate')
transform.space = 'local'

const box2 = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 'blue' }),
)
transform.add(box2)

const canvas = document.getElementById('root') as HTMLCanvasElement

//orbit (controls)
const orbit = new OrbitHandles(canvas, camera)
orbit.bind(scene)

const { update: updateForwardHtmlEvents } = forwardHtmlEvents(canvas, () => camera, scene)

const renderer = new WebGLRenderer({ antialias: true, canvas })

renderer.setAnimationLoop((time) => {
  updateForwardHtmlEvents()
  orbit.update()
  pivot.update(time, camera)
  transform.update(time, camera)
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

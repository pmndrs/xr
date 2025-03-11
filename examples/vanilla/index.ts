import { XRLayer, XROrigin, createXRStore, makeTeleportTarget } from '@pmndrs/xr'
import { PointerEventsMap } from '@pmndrs/pointer-events'
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
import { reversePainterSortStable, Container, Image, Text, Svg, Root } from '@pmndrs/uikit'
import { Delete } from '@pmndrs/uikit-lucide'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 1
camera.position.y = 1

const scene = new Scene()
const origin = new XROrigin(camera)
scene.add(origin)

const boxMaterial = new MeshBasicMaterial({ color: 'red' })
const box = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  boxMaterial,
)
//scene.add(box)
box.pointerEventsType = { deny: 'grab' }
box.addEventListener('pointerdown', () => boxMaterial.color.set('blue'))
box.addEventListener('pointerup', () => boxMaterial.color.set('red'))
box.addEventListener('click', () => boxMaterial.color.set('green'))

const canvas = document.getElementById('root') as HTMLCanvasElement

const renderer = new WebGLRenderer({ antialias: true, canvas, alpha: true })
renderer.xr.enabled = true

const teleportTarget = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: 'black' }))
teleportTarget.position.y = -0.5
teleportTarget.scale.set(100, 1, 100)
makeTeleportTarget(teleportTarget, camera, (point) => origin.position.copy(point))
scene.add(teleportTarget)

const store = createXRStore(canvas, scene, () => camera, renderer.xr, {
  hand: {
    model: { colorWrite: false, renderOrder: -1 },
    grabPointer: false,
    teleportPointer: true,
  },
  controller: {
    model: { colorWrite: false, renderOrder: -1 },
    teleportPointer: true,
  },
})
document.getElementById('enter-ar')?.addEventListener('click', () => store.enterAR())
document.getElementById('enter-vr')?.addEventListener('click', () => store.enterVR())

scene.add(box)

const testImg = document.createElement('video')
testImg.src = 'test.mp4'
testImg.muted = true
testImg.autoplay = true
testImg.loop = true
testImg.style.opacity = '0'
testImg.style.pointerEvents = 'none'
document.body.appendChild(testImg)
const layer = new XRLayer(store, renderer, {
  src: testImg,
})
layer.scale.setScalar(1)
layer.position.set(1.5, 1, -1)
scene.add(layer)

//UI
const group = new Group()
const root = new Root(camera, renderer, {
  pixelSize: 0.001,
  width: 1000,
  height: 1000,
  flexDirection: 'column',
  gap: 30,
  borderRadius: 10,
  padding: 10,
  alignItems: 'center',
  backgroundColor: 'red',
  hover: { backgroundColor: 'green' },
  overflow: 'scroll',
})
group.add(root)
scene.add(group)
group.position.z = -1
group.position.y = 1
const del = new Delete({ width: 100, flexShrink: 0 })
const svg = new Svg({ src: 'example.svg', height: '20%', flexShrink: 0 })
const text = new Text('Hello World', { fontSize: 40, flexShrink: 0 })
const a = new Container({ flexShrink: 0, alignSelf: 'stretch', flexGrow: 1, backgroundColor: 'blue' })
const x = new Container({
  flexShrink: 0,
  padding: 20,
  height: '100%',
  flexGrow: 1,
  hover: { backgroundColor: 'yellow' },
  backgroundColor: 'green',
  flexBasis: 0,
  justifyContent: 'center',
  onSizeChange: console.log,
})
const img = new Image({
  src: 'https://picsum.photos/300/300',
  borderRadius: 1000,
  aspectRatio: 1,
  height: '100%',
  flexShrink: 0,
})
root.add(del, svg, text, x, img)
x.add(a)

let prevTime: undefined | number

renderer.setAnimationLoop((time, frame) => {
  const delta = prevTime == null ? 0 : time - prevTime
  prevTime = time
  box.rotation.y = time * 0.0001
  root.update(delta / 1000)
  store.update(frame, delta)
  renderer.render(scene, camera)
})
renderer.localClippingEnabled = true
renderer.setTransparentSort(reversePainterSortStable)

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { PointerEventsMap, getVoidObject, forwardHtmlEvents, forwardObjectEvents } from '@pmndrs/pointer-events'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 2

const scene = new Scene()

const frambuffer = new WebGLRenderTarget(1024, 1024)

const plane = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: frambuffer.texture }))
plane.scale.setScalar(2)
scene.add(plane)

plane.addEventListener('pointerenter', () => (innerScene.background = new Color('orange')))
plane.addEventListener('pointerleave', () => (innerScene.background = new Color('white')))

const innerScene = new Scene()
innerScene.background = new Color('white')
const innerCamera = new PerspectiveCamera(70, 1, 0.01, 100)
innerCamera.position.z = 2
const boxMaterial = new MeshBasicMaterial({ color: 'red' })
const box = new Mesh<BoxGeometry, MeshBasicMaterial, Object3DEventMap & PointerEventsMap>(
  new BoxGeometry(),
  boxMaterial,
)
innerScene.add(box)
box.addEventListener('pointerover', () => {
  boxMaterial.color.set('blue')
})
box.addEventListener('pointerdown', (e) => {
  console.log(e)
  box.setPointerCapture(e.pointerId)
})
box.addEventListener('pointerout', () => boxMaterial.color.set('red'))

getVoidObject(innerScene).addEventListener('click', () => console.log('click inner'))
getVoidObject(scene).addEventListener('click', () => console.log('click outer'))

const canvas = document.getElementById('root') as HTMLCanvasElement

const { update: updateForwardHtmlEvents } = forwardHtmlEvents(canvas, () => camera, scene)
const { update: updateForwardObjectEvents } = forwardObjectEvents(plane, () => innerCamera, innerScene)

const renderer = new WebGLRenderer({ antialias: true, canvas })

renderer.setAnimationLoop((time) => {
  updateForwardHtmlEvents()
  updateForwardObjectEvents()
  box.rotation.y = time * 0.0001
  plane.rotation.y = Math.sin(time * 0.001) * 0.3
  renderer.setRenderTarget(frambuffer)
  renderer.render(innerScene, innerCamera)
  renderer.setRenderTarget(null)
  renderer.render(scene, camera)
})

function updateSize() {
  const { width, height } = canvas.getBoundingClientRect()
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

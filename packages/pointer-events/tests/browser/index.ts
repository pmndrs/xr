import { PointerEventsMap, forwardHtmlEvents } from '../../src/index.js'
//@ts-ignore
import e from './elements.json'
import {
  Scene,
  OrthographicCamera,
  Object3D,
  Mesh,
  PlaneGeometry,
  CircleGeometry,
  BufferGeometry,
  Material,
  Object3DEventMap,
  WebGLRenderer,
} from 'three'

const scene = new Scene()
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 200)
camera.position.z = 100
//setup threejs event forwarding
forwardHtmlEvents(document.body, camera, scene, {
  forwardPointerCapture: false,
  clickThesholdMs: 1000 /*increasing threshold for slow testing machines*/,
})

const renderer = new WebGLRenderer({ antialias: true, canvas })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(() => renderer.render(scene, camera))

const elements = e as Array<ElementInfo>

export type ElementInfo = {
  rotation: [number, number, number]
  scale: [number, number, number]
  translate: [number, number, number]
  type: 'circle' | 'rectangle'
  capture?: boolean
  pointerEvents?: 'none' | 'auto'
  children?: Array<ElementInfo>
  id: string
  index: number
}

function setup(elements?: Array<ElementInfo>, prefix: string = '') {
  if (elements == null) {
    return
  }
  const length = elements.length
  for (let i = 0; i < length; i++) {
    elements[i].id = `${prefix}${i}`
    elements[i].index = i
    setup(elements[i].children, `${prefix}${i}:`)
  }
  elements.sort(({ translate: [, , z1] }, { translate: [, , z2] }) => z1 - z2)
}

setup(elements)

const listeners: Array<keyof PointerEventsMap> = [
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'click',
  'dblclick',
  'contextmenu',
  'wheel',
]

function addElements(elements: Array<ElementInfo>, domParent: HTMLElement, canvasParent: Object3D) {
  const length = elements.length
  let zIndex = 0
  for (const {
    index,
    id,
    rotation: [rx, ry, rz],
    scale: [sx, sy, sz],
    translate: [tx, ty, tz],
    type,
    capture,
    pointerEvents,
    children,
  } of elements) {
    //create html element
    const div = document.createElement('div')
    div.style.backgroundColor = `hsl(${(360 * index) / length} 100% 50%)`
    div.style.position = 'absolute'
    div.style.inset = '0px'
    div.style.pointerEvents = pointerEvents ?? 'auto'
    div.style.borderRadius = type === 'circle' ? '100%' : '0px'
    div.style.zIndex = zIndex.toString()
    div.style.transformOrigin = 'center'
    div.style.transform = `translate3d(${to(tx, 'vw')}, ${to(ty, 'vh')}, ${to(
      tz,
      'vh',
    )}) rotateZ(${rx}deg) rotateY(${ry}deg) rotateX(${rz}deg) scale3d(${sx},${sy},${sz}) `
    domParent.appendChild(div)
    if (capture) {
      div.addEventListener('pointerdown', (e) => (e.target as HTMLDivElement).setPointerCapture(e.pointerId))
    }
    for (const listener of listeners) {
      div.addEventListener(listener, (e) => {
        //e.stopPropagation() we simulate stop propagation using e.target === div
        if (e.target === div) {
          console.log('[dom]', id, listener)
        }
      })
    }

    const object = new Mesh<BufferGeometry, Material, Object3DEventMap & PointerEventsMap>()
    object.pointerEvents = pointerEvents ?? 'auto'
    object.geometry = type === 'circle' ? new CircleGeometry(0.5, 128) : new PlaneGeometry()
    object.position.set(tx, ty, tz)
    object.rotation.set(toRad(rx), toRad(ry), toRad(rz))
    object.scale.set(sx, sy, sz)
    canvasParent.add(object)
    if (capture) {
      object.addEventListener('pointerdown', (e) => e.target.setPointerCapture(e.pointerId))
    }
    for (const listener of listeners) {
      object.addEventListener(listener, (e) => {
        e.stopPropagation()
        console.log('[canvas]', id, listener)
      })
    }

    //create canvas element

    //children
    zIndex++
    if (children != null) {
      addElements(children, div, object)
    }
  }
}

function toRad(value: number) {
  return (Math.PI * value) / 180
}

addElements(elements, document.body, scene)

function to(v: number, unit: string): string {
  return `${v * 100}${unit}`
}

import { BoxGeometry, Mesh, Object3D, PerspectiveCamera, Raycaster, Scene } from 'three'
import { bench, describe } from 'vitest'
import { CombinedPointer } from '../src/combine.js'
import { createRayPointer } from '../src/pointer/index.js'

const camera = new PerspectiveCamera()
const combinedPointer = new CombinedPointer(true)
const leftPointer = new CombinedPointer(false)
combinedPointer.register(leftPointer)
new Array(5).fill(undefined).forEach(() =>
  leftPointer.register(
    createRayPointer(
      () => camera,
      {
        current: new Object3D(),
      },
      {},
    ),
  ),
)
const rightPointer = new CombinedPointer(false)
combinedPointer.register(rightPointer)
new Array(5).fill(undefined).forEach(() =>
  rightPointer.register(
    createRayPointer(
      () => camera,
      {
        current: new Object3D(),
      },
      {},
    ),
  ),
)

const singlePointer = createRayPointer(
  () => camera,
  {
    current: new Object3D(),
  },
  {},
)

function createScene(hor: 'small' | 'big', depth: 'small' | 'big'): Scene {
  const scene = new Scene()
  const horLength = hor === 'small' ? 1 : 20
  const depthLength = depth === 'small' ? 1 : 20
  let hasPointerEvents = true
  for (let i = 0; i < horLength; i++) {
    const object = new Object3D()
    object.position.x = 1000
    object.position.z = 1000
    let lastObject!: Object3D
    for (let i = 0; i < depthLength; i++) {
      object.add((lastObject = new Object3D()))
    }
    const mesh = new Mesh(new BoxGeometry())
    mesh.pointerEvents = hasPointerEvents ? 'auto' : 'listener'
    lastObject.add(mesh)
    scene.add(object)
    hasPointerEvents = !hasPointerEvents
  }
  return scene
}

const sceneHorSmallDepthSmall = createScene('small', 'small')
const sceneHorBigDepthSmall = createScene('big', 'small')
const sceneHorSmallDepthBig = createScene('small', 'big')
const sceneHorBigDepthBig = createScene('big', 'big')
const raycaster = new Raycaster()

describe('pointer performance - scene: horizontal small, depth small; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorSmallDepthSmall)
  })
  bench('scene: horizontal small, depth small; pointer: 1', () => {
    singlePointer.move(sceneHorSmallDepthSmall, { timeStamp: performance.now() })
  })
  bench('scene: horizontal small, depth small; pointer: 10', () => {
    combinedPointer.move(sceneHorSmallDepthSmall, { timeStamp: performance.now() })
  })
})

describe('pointer performance - scene: horizontal big, depth small; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorBigDepthSmall)
  })
  bench('scene: horizontal big, depth small; pointer: 1', () => {
    singlePointer.move(sceneHorBigDepthSmall, { timeStamp: performance.now() })
  })
  bench('scene: horizontal big, depth small; pointer: 10', () => {
    combinedPointer.move(sceneHorBigDepthSmall, { timeStamp: performance.now() })
  })
})

describe('pointer performance - scene: horizontal small, depth big; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorSmallDepthBig)
  })
  bench('scene: horizontal small, depth big; pointer: 1', () => {
    singlePointer.move(sceneHorSmallDepthBig, { timeStamp: performance.now() })
  })
  bench('scene: horizontal small, depth big; pointer: 10', () => {
    combinedPointer.move(sceneHorSmallDepthBig, { timeStamp: performance.now() })
  })
})

describe('pointer performance - scene: horizontal big, depth big; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorBigDepthBig)
  })
  bench('scene: horizontal big, depth big; pointer: 1', () => {
    singlePointer.move(sceneHorBigDepthBig, { timeStamp: performance.now() })
  })
  bench('scene: horizontal big, depth big; pointer: 10', () => {
    combinedPointer.move(sceneHorBigDepthBig, { timeStamp: performance.now() })
  })
})

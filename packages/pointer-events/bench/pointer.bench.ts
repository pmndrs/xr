import { bench, describe } from 'vitest'
import { createRayPointer } from '../src/pointer/index.js'
import { BoxGeometry, Mesh, Object3D, Raycaster, Scene } from 'three'

const tenPointer = new Array(10).fill(undefined).map(() =>
  createRayPointer(
    {
      current: new Object3D(),
    },
    {},
  ),
)

const onePointer = new Array(1).fill(undefined).map(() =>
  createRayPointer(
    {
      current: new Object3D(),
    },
    {},
  ),
)

function createScene(hor: 'small' | 'big', depth: 'small' | 'big'): Scene {
  const scene = new Scene()
  const horLength = hor === 'small' ? 1 : 20
  const depthLength = depth === 'small' ? 1 : 20
  for (let i = 0; i < horLength; i++) {
    const object = new Object3D()
    object.position.x = 1000
    object.position.z = 1000
    let lastObject!: Object3D
    for (let i = 0; i < depthLength; i++) {
      object.add((lastObject = new Object3D()))
    }
    lastObject.add(new Mesh(new BoxGeometry()))
    scene.add(object)
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
    for (const pointer of onePointer) {
      pointer.move(sceneHorSmallDepthSmall, { timeStamp: performance.now() })
    }
  })
  bench('scene: horizontal small, depth small; pointer: 10', () => {
    for (const pointer of tenPointer) {
      pointer.move(sceneHorSmallDepthSmall, { timeStamp: performance.now() })
    }
  })
})

describe('pointer performance - scene: horizontal big, depth small; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorBigDepthSmall)
  })
  bench('scene: horizontal big, depth small; pointer: 1', () => {
    for (const pointer of onePointer) {
      pointer.move(sceneHorBigDepthSmall, { timeStamp: performance.now() })
    }
  })
  bench('scene: horizontal big, depth small; pointer: 10', () => {
    for (const pointer of tenPointer) {
      pointer.move(sceneHorBigDepthSmall, { timeStamp: performance.now() })
    }
  })
})

describe('pointer performance - scene: horizontal small, depth big; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorSmallDepthBig)
  })
  bench('scene: horizontal small, depth big; pointer: 1', () => {
    for (const pointer of onePointer) {
      pointer.move(sceneHorSmallDepthBig, { timeStamp: performance.now() })
    }
  })
  bench('scene: horizontal small, depth big; pointer: 10', () => {
    for (const pointer of tenPointer) {
      pointer.move(sceneHorSmallDepthBig, { timeStamp: performance.now() })
    }
  })
})

describe('pointer performance - scene: horizontal big, depth big; ', () => {
  bench(`raycast`, () => {
    raycaster.intersectObject(sceneHorBigDepthBig)
  })
  bench('scene: horizontal big, depth big; pointer: 1', () => {
    for (const pointer of onePointer) {
      pointer.move(sceneHorBigDepthBig, { timeStamp: performance.now() })
    }
  })
  bench('scene: horizontal big, depth big; pointer: 10', () => {
    for (const pointer of tenPointer) {
      pointer.move(sceneHorBigDepthBig, { timeStamp: performance.now() })
    }
  })
})

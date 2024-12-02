# pointer-events

_framework agnostic pointer-events implementation for three.js_

based on [🎯 Designing Pointer-events for 3D & XR](https://polar.sh/bbohlender/posts/designing-pointer-events-for-3d)

## How to use

```js
import * as THREE from 'three'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

const canvas = document.getElementById('canvas')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10)
camera.position.z = 1
const { update } = forwardHtmlEvents(canvas, () => camera, scene)

const width = window.innerWidth,
  height = window.innerHeight

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const material = new THREE.MeshBasicMaterial({ color: new THREE.Color('red') })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

mesh.addEventListener('pointerover', () => material.color.set('blue'))
mesh.addEventListener('pointerout', () => material.color.set('red'))

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
renderer.setAnimationLoop(() => {
  update()
  renderer.render(scene, camera)
})
```

## Filtering

Based on the css `pointer-events` property, the behavior of pointer events can be configured with the values `none`, `listener`, or `auto`.

```js
object.pointerEvents = 'none'
```

The values `none` and `auto` correspond to the css properties, where `none` means that an object is not directly targetted and `auto` means the object is always targetted for events. The additional value `listener`, which is the default value, expresses that the object is only targetted by events if the object has any listeners. In 3D scenes this default is more reasonable than `auto`, which is the default in the web, because 3D scenes often contain semi-transparent content, such as particles, that should not catch pointer events by default.

In addition to the `pointerEvents` property, each 3D object can also filter events based on the `pointerType` with the `pointerEventsType` property. This property defaults to the value `all`, which expresses that pointer events from pointers of all types should be accepted. To filter specific pointer types, such as `screen-mouse`, which represents a normal mouse used through a 2D screen, `pointerEventsType` can be set to `{ allow: "screen-mouse" }` or `{ deny: "screen-touch" }`. `pointerEventsType`'s `allow` and `deny` accept strings and array of strings. In case more custom logic is needed, `pointerEventsType` also accepts a function. In general the pointer types `screen-touch`, `screen-pen`, `ray`, `grab`, and `touch` are used by default. For pointer events that were forwarded through a portal using `forwardObjectEvents`, their `pointerType` is prefixed with `forward-`, while events forwarded from the dom to the scene are prefixed with `screen-`.

## But wait ... there's more

Create your own `Pointer` that can represent a WebXR controller or something else. These `Pointer` can use a normal `Ray` for intersection, or a set of `Lines`, or even a `Sphere`, for grab and touch events.

## Performance

In some cases multi-modal interactivity requires multiple pointers at the same time. Executing `pointer.move`, such as in the following example, can lead to performance issues because the scene graph will be traversed several times.

```ts
leftGrabPointer.move()
leftTouchPointer.move()
leftRayPointer.move()
rightGrabPointer.move()
rightTouchPointer.move()
rightRayPointer.move()
```

In this case, performance can be improved by combining the pointer using `CombinedPointer`, which will traverse the scene graph once per combined pointer, calculating the intersections for each pointer on each object.

```ts
const leftPointer = new CombinedPointer()
const rightPointer = new CombinedPointer()
leftPointer.register(leftGrabPointer)
leftPointer.register(leftTouchPointer)
leftPointer.register(leftRayPointer)
rightPointer.register(rightGrabPointer)
rightPointer.register(rightTouchPointer)
rightPointer.register(rightRayPointer)

leftPointer.move()
rightPointer.move()
```

## Pitfalls

The `pointerEvents` attribute of any Mesh/Object3D/... will not be cloned when cloning the object.

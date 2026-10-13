# pointer-events

_framework agnostic pointer-events implementation for three.js_

based on [🎯 Designing Pointer-events for 3D & XR](https://polar.sh/bbohlender/posts/designing-pointer-events-for-3d)

Mouse, touch, XR controllers, hands, and custom inputs all become pointers that emit DOM-style pointer events (`click`, `pointerover`, `pointerdown`, ...) on three.js objects, including pointer capture and per-object filtering.

## How to use

```bash
npm install three @pmndrs/pointer-events
```

```js
import * as THREE from 'three'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

const canvas = document.getElementById('canvas')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
camera.position.z = 1
const { update } = forwardHtmlEvents(canvas, () => camera, scene)

const material = new THREE.MeshBasicMaterial({ color: 'red' })
const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), material)
scene.add(mesh)

mesh.addEventListener('pointerover', () => material.color.set('blue'))
mesh.addEventListener('pointerout', () => material.color.set('red'))

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(() => {
  update()
  renderer.render(scene, camera)
})
```

## Agent skills

This package ships a usage skill for coding agents, matching the installed version. Install it with [skills-npm](https://github.com/antfu/skills-npm), which links the skills of your installed packages for your agent:

```bash
npm i -D skills-npm
npx skills-npm setup
```

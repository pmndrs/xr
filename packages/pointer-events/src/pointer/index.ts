let pointerIdCounter = 23412

export function generateUniquePointerId() {
  return pointerIdCounter++
}

export * from './grab.js'
export * from './ray.js'
export * from './lines.js'
export * from './touch.js'

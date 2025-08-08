---
title: Hit Test
description: How to add hit testing capabilities to your AR experiences?
nav: 19
---

Hit testing is a technique that allows developers to check for intersections with real-world geometry in AR experiences. `@react-three/xr` provides hooks and components for setting up hit testing. This tutorial covers all the hit testing hooks available in React Three XR and demonstrates how to use them effectively.

## Overview of Hit Testing Hooks

React Three XR provides three hooks for hit testing:

- **`useXRHitTest`** - Continuous hit testing with automatic frame updates
- **`useXRHitTestSource`** - Lower-level hook for creating and managing hit test sources
- **`useXRRequestHitTest`** - One-time hit test requests on demand

Additionally, React Three XR provides the `XRHitTest` component, which is a convenience wrapper for using the `useXRHitTest` hook to perform continuous hit testing.

## useXRHitTest Hook

The `useXRHitTest` hook is the most commonly used hook for continuous hit testing. It automatically performs hit tests every frame and calls your callback function with the results.

**What it does:** Sets up continuous hit testing that runs every frame, providing real-time intersection data with the real world.

**When to use it:** Use this when you need continuous tracking of where a ray intersects with real-world surfaces, such as for cursor positioning, object placement previews, or interactive AR elements.

**Parameters:**
- `fn` - Callback function that receives hit test results and a world matrix helper
- `relativeTo` - The object, XR space, or reference space to cast rays from
- `trackableType` - Optional parameter specifying what types of surfaces to hit test against

Here's the basic example using the `XRHitTest` component (which internally uses `useXRHitTest`):

```tsx
const matrixHelper = new Matrix4()
const hitTestPosition = new Vector3()

const store = createXRStore({
  hand: {
    right: () => {
      const state = useXRHandState()
      return (
        <>
          <XRHandModel />
          <XRHitTest
            space={state.inputSource.targetRaySpace}
            onResults={(results, getWorldMatrix) => {
              if (results.length === 0) {
                return
              }
              getWorldMatrix(matrixHelper, results[0])
              hitTestPosition.setFromMatrixPosition(matrixHelper)
            }}
          />
        </>
      )
    },
  },
})
```

You can also use the hook directly in your components:

```tsx
function ContinuousHitTest() {
  const meshRef = useRef<Mesh>(null)
  const [hitPosition, setHitPosition] = useState<Vector3 | null>(null)
  
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length > 0) {
        const matrix = new Matrix4()
        getWorldMatrix(matrix, results[0])
        const position = new Vector3().setFromMatrixPosition(matrix)
        setHitPosition(position)
      }
    },
    meshRef, // Cast rays from this mesh's position
    'plane' // Only hit test against detected planes
  )
  
  return <mesh ref={meshRef}>/* your mesh content */</mesh>
}
```

## useXRHitTestSource Hook

The `useXRHitTestSource` hook provides lower-level access to hit test sources, giving you more control over when and how hit tests are performed.

**What it does:** Creates and manages an XR hit test source that you can use to manually request hit test results.

**When to use it:** Use this when you need more granular control over hit testing, such as performing hit tests only under specific conditions, or when you want to manage the hit test lifecycle manually.

**Parameters:**
- `relativeTo` - The object, XR space, or reference space to cast rays from
- `trackableType` - Optional parameter specifying what types of surfaces to hit test against

**Returns:** A hit test source object that you can use with `frame.getHitTestResults()`

```tsx
function ManualHitTest() {
  const meshRef = useRef<Mesh>(null)
  const hitTestSource = useXRHitTestSource(meshRef, 'plane')
  const [hitResults, setHitResults] = useState<XRHitTestResult[]>([])
  
  useFrame((_, __, frame: XRFrame | undefined) => {
    // Only perform hit testing when certain conditions are met
    if (frame && hitTestSource && someCondition) {
      const results = frame.getHitTestResults(hitTestSource.source)
      setHitResults(results)
    }
  })
  
  return (
    <mesh ref={meshRef}>
      {/* Render hit test results */}
      {hitResults.map((result, index) => {
        const matrix = new Matrix4()
        hitTestSource?.getWorldMatrix(matrix, result)
        const position = new Vector3().setFromMatrixPosition(matrix)
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color="red" />
          </mesh>
        )
      })}
    </mesh>
  )
}
```

## useXRRequestHitTest Hook

The `useXRRequestHitTest` hook provides a function for one-time hit test requests, perfect for event-driven hit testing.

**What it does:** Returns a function that can perform a single hit test request when called.

**When to use it:** Use this for event-driven hit testing, such as when a user taps the screen, clicks a button, or performs a gesture. It's ideal for placing objects or checking intersections at specific moments.

**Returns:** A function that takes the same parameters as other hit test hooks and returns a promise with hit test results

```tsx
function EventDrivenHitTest() {
  const requestHitTest = useXRRequestHitTest()
  const meshRef = useRef<Mesh>(null)
  const [placedObjects, setPlacedObjects] = useState<Vector3[]>([])
  
  const handleTap = async () => {
    if (!meshRef.current) return
    
    try {
      const results = await requestHitTest(meshRef, ['plane', 'mesh'])
      if (results && results.length > 0) {
        const matrix = new Matrix4()
        // Note: You'll need to get the world matrix helper from the XR store
        // This is a simplified example
        const position = new Vector3().setFromMatrixPosition(matrix)
        setPlacedObjects(prev => [...prev, position])
      }
    } catch (error) {
      console.error('Hit test failed:', error)
    }
  }
  
  return (
    <>
      <mesh ref={meshRef} onClick={handleTap}>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
      
      {/* Render placed objects */}
      {placedObjects.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      ))}
    </>
  )
}
```

## Trackable Types

All hit testing hooks support specifying trackable types to control what surfaces the hit tests should target:

- `'plane'` - Hit test against detected planes (floors, walls, tables)
- `'point'` - Hit test against feature points in the environment
- `'mesh'` - Hit test against detected meshes (requires mesh detection support)

You can specify a single type or an array of types:

```tsx
// Single type
useXRHitTest(callback, spaceRef, 'plane')

// Multiple types
useXRHitTest(callback, spaceRef, ['plane', 'mesh'])
```

## Practical Example: Object Placement

Here's a complete example combining multiple hooks for a robust object placement system:

```tsx
function ObjectPlacement() {
  const [placedObjects, setPlacedObjects] = useState<Vector3[]>([])
  const [previewPosition, setPreviewPosition] = useState<Vector3 | null>(null)
  const controllerRef = useRef<Group>(null)
  
  // Continuous hit testing for preview
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length > 0) {
        const matrix = new Matrix4()
        getWorldMatrix(matrix, results[0])
        const position = new Vector3().setFromMatrixPosition(matrix)
        setPreviewPosition(position)
      } else {
        setPreviewPosition(null)
      }
    },
    'viewer', // Use viewer space for screen-based hit testing
    'plane'
  )
  
  const placeObject = async () => {
    if (previewPosition) {
      setPlacedObjects(prev => [...prev, previewPosition.clone()])
    }
  }
  
  return (
    <>
      {/* Preview object at hit test position */}
      {previewPosition && (
        <mesh position={previewPosition}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Placed objects */}
      {placedObjects.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="green" />
        </mesh>
      ))}
      
      {/* Placement trigger */}
      <button onClick={placeObject}>Place Object</button>
    </>
  )
}
```

With the `hitTestPosition` containing the world position of the last hit test, we can use it to create a 3d object and sync it to the object's position on every frame.

```tsx
function Point() {
  const ref = useRef<Mesh>(null)
  useFrame(() => ref.current?.position.copy(hitTestPosition))
  return (
    <mesh scale={0.05} ref={ref}>
      <sphereGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}
```

Alternatively, for devices that provide mesh detection, we can also add normal pointer event listeners to an XR Mesh to achieve the same behavior. Check out [this tutorial](./object-detection.md) for more information about mesh detection.

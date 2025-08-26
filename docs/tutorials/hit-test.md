---
title: Hit Test
description: How to add hit testing capabilities to your AR experiences
nav: 19
---

Hit testing is a technique that allows developers to check for intersections with real-world surfaces in AR experiences. `@react-three/xr` provides hooks and components for setting up hit testing. This tutorial covers all the hit testing hooks available in React Three XR and demonstrates how to use them effectively.

## Overview of Hit Testing Components

React Three XR provides three hooks for hit testing:

- **`useXRHitTest`** - Provides continuous hit testing with automatic frame updates
- **`useXRHitTestSource`** - Lower-level hook for creating and managing hit test sources
- **`useXRRequestHitTest`** - One-time hit test requests on demand

Additionally, React Three XR provides the `XRHitTest` component, which is a convenience wrapper for using the `useXRHitTest` hook to perform continuous hit testing.

All rays cast by these components originate from the source's position and are cast in the direction that the source object is oriented (quaternion; typically -z).

## useXRHitTest Hook

The `useXRHitTest` hook is the most commonly used hook for hit testing in the library. It automatically performs hit tests every frame and calls your callback function with the results.

**What it does:** Sets up continuous hit testing that runs every frame, providing real-time intersection data with the real world.

**When to use it:** Use this when you need continuous tracking of where a ray intersects with real-world surfaces, such as for cursor positioning, object placement previews, or interactive AR elements.

**Parameters:**
- `fn` - Callback function that receives hit test results and a function to retrieve the world matrix 
- `relativeTo` - The object, XR space, or reference space to cast rays from. This reference must be static in your scene.
- `trackableType` - Optional parameter specifying what types of surfaces to hit test against


```tsx
const matrixHelper = new Matrix4()
const hitTestPosition = new Vector3()

function ContinuousHitTest() {
  const previewRef = useRef<Mesh>(null)
  
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) return

      getWorldMatrix(matrixHelper, results[0])
      hitTestPosition.setFromMatrixPosition(matrixHelper)
    },
    'viewer', // Cast rays from the viewer reference space. This will typically be either the camera or where the user is looking
    'plane' // Only hit test against detected planes
  )

  useFrame(() => {
    if (hitTestPosition && previewRef.current) {
      previewRef.current.position.copy(hitTestPosition)
    }
  })
  
  return (
      {/* Renders a sphere where the hit test intersects with the plane */}
      <mesh ref={previewRef} position={hitPosition}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
  )
}
```

## XRHitTest

`XRHitTest` is a component that wraps the `useXRHitTest` hook. This makes it easier to add hit testing anywhere within your component tree. 

```tsx
const matrixHelper = new Matrix4()
const hitTestPosition = new Vector3()

const store = createXRStore({
  hand: () => {
    const inputSourceState = useXRInputSourceStateContext()

    return (
      <>
        <DefaultXRHand />
        <XRHitTest
          space={inputSourceState.inputSource.targetRaySpace}
          onResults={(results, getWorldMatrix) => {
            if (results.length === 0) return
            getWorldMatrix(matrixHelper, results[0])
            hitTestPosition.setFromMatrixPosition(matrixHelper)
          }}
        />
      </>
    )
  },
})
```

`XRHitTest` has all of the same functionality as the `useXRHitTest` hook, just that it's built as a component.

## useXRHitTestSource Hook 

The `useXRHitTestSource` hook provides lower-level access to hit test sources, giving you more control over when and how hit tests are performed. It is the same as the `useXRHitTest` hook, the only difference being that you have to manually check for hit test results; typically every frame, or every few frames.

**What it does:** Does the same thing as the `useXRHitTest` hook, but does not automatically hit test every frame.

**When to use it:** In most cases you should use either `useXRHitTest` or `useXRRequestHitTest`, but you can use this hook when you have a static hit test source that you only want to occasionally perform constant hit tests from. Or if you want to recreate the `useXRHitTest` behavior manually.

**Parameters:**
- `relativeTo` - The object, XR space, or reference space to cast rays from
- `trackableType` - Optional parameter specifying what types of surfaces to hit test against

**Returns:** A hit test source object that you can use with `frame.getHitTestResults()`

```tsx
function ManualHitTest() {
  const meshRef = useRef<Mesh>(null)
  const hitTestSource = useXRHitTestSource(meshRef)
  const [someCondition, setSomeCondition] = useState(false)
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
      {/* Render hit test results. This will put spheres everywhere the hit test succeeds. In a real app don't use index as the key */}
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

The `useXRRequestHitTest` hook provides a function for one-time hit test requests. Useful for event-driven hit testing. Cannot be called in the `useFrame` hook.

**What it does:** Returns a function that can perform a single hit test request when called.

**When to use it:** Use this for event-driven hit testing, such as when a user taps the screen, clicks a button, or performs a gesture. It's ideal for placing objects or checking intersections at specific moments.

**Returns:** A function that takes the same parameters as other hit test hooks and returns a promise with hit test results

```tsx
const matrixHelper = new Matrix4()
function EventDrivenHitTest() {
  const requestHitTest = useXRRequestHitTest()
  const meshRef = useRef<Mesh>(null)
  const [placedObjects, setPlacedObjects] = useState<Vector3[]>([])
  
  const handleTap = async () => {
    if (!meshRef.current) return
    
    try {
      const results = await requestHitTest(meshRef, ['plane', 'mesh'])
      if (results?.length > 0) {
        const position = new Vector3().setFromMatrixPosition(matrixHelper)
        setPlacedObjects(prev => [...prev, position])
      }
    } catch (error) {
      console.error('Hit test failed:', error)
    }
  }
  
  return (
    <>
      <IfInSessionMode allow={'immersive-ar'}>
        <XRDomOverlay>
          <button onClick={handleTap}>Place Object</button>
        </XRDomOverlay>
      </IfInSessionMode>
      
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
const matrixHelper = new Matrix4()
const hitTestPositionHelper = new Vector3()

function ObjectPlacement() {
  const [placedObjects, setPlacedObjects] = useState<Vector3[]>([])
  const [previewPosition, setPreviewPosition] = useState<Vector3 | null>(null)
  const controllerRef = useRef<Group>(null)
  
  // Continuous hit testing for preview
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length > 0) {
        getWorldMatrix(matrixHelper, results[0])
        const position = hitTestPositionHelper.setFromMatrixPosition(matrixHelper)
        setPreviewPosition(position)
      } else {
        setPreviewPosition(null)
      }
    },
    'viewer' // Use viewer space for screen-based hit testing
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
      <IfInSessionMode allow={'immersive-ar'}>
        <XRDomOverlay>
          <button onClick={placeObject}>Place Object</button>
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  )
}
```

Alternatively, for devices that provide mesh detection -- such as newer Meta Quest devices -- you can also add normal pointer event listeners to an XR Mesh to achieve the same behavior. Check out [this tutorial](./object-detection.md) for more information about mesh detection.

# @react-three/xr

```tsx
import { Canvas } from "@react-three/fiber"
import { createXRStore } from "@react-three/xr"

const store = createXRStore()

export function App() {
    return <>
        <button onClick={() => store.enterAR()}>Enter AR</button>
        <Canvas>
            <XR store={store}>
                <mesh>
                    <boxGeometry />
                </mesh>
            </XR>
        </Canvas>
    </>
}
```

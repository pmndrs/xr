---
title: Dom Overlay
description: How to add HTML elements for hand-held AR experiences with Dom overlay?
nav: 19
---

For hand-held AR experiences, such as those using a Smartphone, WebXR offers the dom overlay capability, allowing developers to use HTML code overlayed over the experience. In case scene 3D overlays or overlays in non-handheld AR/VR experiences are needed, check out [pmndrs/uikit](https://github.com/pmndrs/uikit).

We can add dom overlay content to an experience using the `XRDomOverlay` component, which allows to write html code inside it. This HTML code will be overlayed over the hand-held AR experience.

```tsx
<XRDomOverlay
  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
>
  <div style={{ backgroundColor: 'red', padding: '1rem 2rem' }}>Hello World</div>
</XRDomOverlay>
```

The following shows the complete code for a simple AR experience with a `Hello World` button that can toggle its color when clicked on. 

```tsx
const store = createXRStore()

export function App() {
  const [bool, setBool] = useState(false)
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas>
        <XR store={store}>
          <ambientLight />
          <XRDomOverlay
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              style={{ backgroundColor: bool ? 'red' : 'green', padding: '1rem 2rem' }}
              onClick={() => setBool((b) => !b)}
            >
 Hello World
            </div>
          </XRDomOverlay>
        </XR>
      </Canvas>
    </>
 )
}
```

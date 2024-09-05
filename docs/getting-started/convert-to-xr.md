---
title: Convert to XR
description: How to convert an existing react-three-fiber app into an interactive immersive experience.
nav: 1
---

In case your app is already an R3F app build with natuerlich or @react-three/xr v5. Check out the migration guides for [natuerlich](../migration/from-natuerlich.md) and [@react-three/xr v5](../migration/from-react-three-xr-5.md).

The first step is to install the latest version of react-three/xr.

```bash
npm install @react-three/xr@latest
```

Next, we import the `createXRStore` and create a xr store.

```tsx
import { createXRStore, XR } from '@react-three/xr'

const store = createXRStore()
```

Using the `store`, we can set up a way for the user to enter the XR experience. For this example, we will just add 2 HTML buttons above your canvas.

```tsx
<>
    <button onClick={() => store.enterVR()}>Enter VR</button>
    <button onClick={() => store.enterAR()}>Enter AR</button>
    <Canvas>
 ...your scene
    </Canvas>
</>
```

Lastly, use the `store` to setup the `XR` component to wrap your scene. 

```tsx
<>
    <button onClick={() => store.enterVR()}>Enter VR</button>
    <button onClick={() => store.enterAR()}>Enter AR</button>
    <Canvas>
        <XR store={store}>
 ...your scene
        </XR>
    </Canvas>
</>
```

**Your application is now useable with an AR or VR headset.**

If something did not work as expected, check out the [Pitfalls](../advanced/pitfalls.md), create an [issue on github](https://github.com/pmndrs/react-xr/issues), or message us on [Discord](https://discord.gg/poimandres).

With this basic XR setup, you can start expanding the features of your XR application. The following questions might help you in integrating those features. 

> How do I move around in my scene?

**↳ Checkout out the tutorial about [XROrigin](../tutorials/origin.md) or [Teleportation](../tutorials/teleport.md).**

> How can I customize the way my hands/controllers/... feel, look, or interact with the scene?

**↳ Check out the tutorial about [Custom Hands/Controllers/...](../tutorials/custom-inputs.md).**

> How do interactions work in XR, and how can I build more advanced interactions?

**↳ Check out the tutorial about [Interactions](../tutorials/interactions.md)**

> How can I leverage the mixed reality features of my headset, such as Plane Detection?

**↳ Check out the tutorial about [Object Detection](../tutorials/object-detection.md)**

> What else can I do? I need inspiration.

**↳ Check out the [examples](./examples.md).**


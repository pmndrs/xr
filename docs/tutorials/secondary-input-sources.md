---
title: Secondary Input Sources
description: How to use primary and secondary input sources (multiple controllers and hands) simultaneously?
nav: 14
---

Most standalone XR headsets support hand and controller tracking. While typical XR experiences often support both input methods, they only use the primary inputs, which refers to one input per hand and limits the inputs to `2`. However, the headset often also tracks the secondary input sources. By enabling the `secondaryInputSources` flag when creating an xr store, we can access the secondary input sources and use them to track real-world objects, for example.

```ts
createXRStore({ secondaryInputSources: true })
```

Secondary input sources are exposed to the developer just like primary input sources, with the exception of the `isPrimary` flat, which is false. The following example illustrates how to show the primary input controllers using the default controller components while rendering the secondary input controllers as simple cubes.

```tsx
createXRStore({
  secondaryInputSources: true,
  controller: () => {
    const { isPrimary } = useXRInputSourceStateContext('controller')
    if (isPrimary) {
      return <DefaultXRController />
    }
    return (
      <mesh>
        <boxGeometry />
      </mesh>
    )
  },
})
```

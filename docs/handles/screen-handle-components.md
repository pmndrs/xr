---
title: Screen Handles  
description: Orbit and Map Handles as replacements for Orbit and Map controls  
nav: 26  
---

Screen handles are available for screen-based devices like smartphones and PCs and allow users to move the camera by dragging, swiping, and scrolling on the screen. Three.js directly offers `OrbitControls` and `MapControls`, which are built for this purpose, and we are building on top of their success. The main difference is that the `OrbitHandles` and `MapHandles` we provide use the event system of the scene, which means that interactions with objects in the scene prevent dragging the camera. Furthermore, the event system can forward the screen inputs on a virtual screen to a virtual camera inside a virtual scene, which is showcased in the [editor example](https://pmndrs.github.io/xr/examples/editor/).

Using the `OrbitHandles` and `MapHandles` in React Three Fiber requires disabling the built-in event system and adding the event system of `@react-three/xr`.

```tsx
import { OrbitHandles } from '@react-three/handles'
import { noEvents, PointerEvents } from '@react-three/xr'

<Canvas events={noEvents}>
  <PointerEvents />
  <OrbitHandles />
</Canvas>
```

## Orbit Handles  
*alias for `OrbitControls`*

Orbit handles allow the user to orbit around a center, which can be moved by panning with a right click or two fingers touching the screen.

### Properties

**store**  
The screen camera store contains the current state of the camera, including the position of the origin, the yaw and pitch of the camera, and the distance of the camera to the origin. By passing an external store to the Orbit Handles, you can take control of the current state of the camera from multiple sources.

**apply**  
The apply function applies the modifications to the screen camera state that occurred based on user interactions to the screen camera store. Overriding this function allows you to manually modify the screen camera store and prevent or restrict certain modifications, such as the maximum pitch angle.

**enabled**  
Allows you to disable the orbit handles momentarily by setting enabled to `false`.  

**damping**  
Allows you to configure how much the camera movement should be smoothed. Set to `true` for the default damping and `false` to disable damping.  

**camera**  
Allows you to configure the camera on which the transformation should be applied. Not setting the camera will apply the transformations to the default camera of the scene.

**rotate**  
Allows you to configure the rotation speed and a filter function to disable rotation on certain input devices. Setting rotate to `false` will disable rotation entirely.

**zoom**  
Allows you to configure the zoom speed and a filter function to disable zooming on certain input devices. Setting zoom to `false` will disable zooming entirely.

**pan**  
Allows you to configure the pan speed and a filter function to disable panning on certain input devices. Setting pan to `false` will disable panning entirely.

## Map Handles  
*alias for `MapControls`*

Map handles have the same properties and functionality as the orbit handles but move the camera's transform origin only in the X and Y planes, which is perfect for building applications with a flat map.
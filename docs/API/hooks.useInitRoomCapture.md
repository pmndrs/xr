---
title: useInitRoomCapture
nav: 32
sourcecode: packages/react/xr/src/hooks.ts
---

> **useInitRoomCapture**(): `undefined` \| () => `Promise`\<`undefined`\>

Initilizes the room capture process.

## Returns

`undefined`

() => `Promise`\<`undefined`\>

XRSession is extended to contain the initiateRoomCapture method which,
if supported, will ask the XR Compositor to capture the current room layout.
It is up to the XRCompositor if this will replace or augment the set of tracked planes.
The user agent MAY also ignore this call, for instance if it doesn’t support a manual room
capture more or if it determines that the room is already set up.
The initiateRoomCapture method MUST only be able to be called once per XRSession.

## Returns

`Promise`\<`undefined`\>

## See

https://immersive-web.github.io/real-world-geometry/plane-detection.html#plane-set

A function to initiate room capture, or undefined if unavailable.

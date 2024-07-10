---
title: Options
description: Explore the extensible options for configuring your xr app
nav: 6
---

@react-three/xr offers a large set of options that can be provided when executing `createXRStore`. Some of these options must be provided before starting xr session, while others can be changed at any time. For instance, the controller options and implementation can always be configured using `store.setController(...)`.

- `foveation` the foveation of the session. The default is undefined, which sets it to the browsers default foveation
- `frameRate` the target framerate of the xr session; can be either undefined, the enums "low", "mid", "high", or a function that receives the available framerates and must return one of them or undefined
- `frameBufferScaling` a number that allows to configure the framebuffer resolution in relation to the native display resoltion. The default is undefined, which is set by the browser. "1" configures the session to render at the native resolution.
- `enterGrantedSession` Defines whether the XR session should automatically start when granted by the browser without a user interaction. The default is true.
- `baseAssetPath` The base path for loading assets such as the hands or the controllers.
- `defaultXRHandProfileId` The default hand profile id when no profile id for the input is found.
- `defaultXRControllerProfileId` The default controller profile id when no profile id for the input is found.
- `controller` allows to configure and overwrite the controller implementation
- `transientPointer` allows to configure and overwrite the transientPointer implementation
- `hand` allows to configure and overwrite the hand implementation
- `gaze` allows to configure and overwrite the gaze implementation
- `screenInput` allows to configure and overwrite the screenInput implementation
- `detectedPlane` allows to configure and overwrite the detectedPlane implementation
- `detectedMesh` allows to configure and overwrite the detectedMesh implementation
- `referenceSpaceType` the reference space of the session which defaults to "local-floor"
- `anchors` whether the WebXR anchor feature is requested or event "required". Default is true.
- `handTracking` whether the WebXR hand tracking feature is requested or event "required". Default is true.
- `layers` whether the WebXR layers feature is requested or event "required". Default is true.
- `meshDetection` whether the WebXR mesh detection feature is requested or event "required". Default is true.
- `planeDetection` whether the WebXR plane detection feature is requested or event "required". Default is true.
- `depthSensing` whether the WebXR depth sensing feature is requested or event "required". Default is false.
- `customSessionInit` allows to overwrite all other feature requests and use a custom session init object instead

---
title: Performance
description: Important considerations for building performant immersive web applications with react-three/xr
nav: 15
---

All performance optimizations for non-immersive 3D web applications are also applicable for immersive XR web applications. Relevant guides on the topic of performance for 3D web applications are the [R3F performance guide](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance), [R3F performance pitfalls](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls), and the [Threejs tips and tricks](https://discoverthreejs.com/tips-and-tricks/#performance). In general, it is good to check if your web application's performance is GPU- or CPU-bound to select the correct optimization techniques.

When it comes to immersive XR web applications, there are a few other options to improve GPU performance. We also recommend taking a look at this [WebXR Performance Optimization guide](https://developer.oculus.com/documentation/web/webxr-perf/). 

## Frame Buffer Scaling

The frame buffer scaling factor allows to control the size of the frame buffer your web application draws to. Decreasing this number can improve performance but reduces the resolution. A frame buffer scaling factor of 1.0 sets the frame buffer resolution to the native display resolution.

## Foveation

Foveation allows rendering with a lower resolution at the edges of the eye's viewport to improve GPU performance. If your application is optimized and the performance is still GPU bound, consider increasing the foveation to improve performance.
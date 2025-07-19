---
title: 3D Concepts for Web Developers
description: A quick refresher on basic 3D concepts for developers coming from a 2D background
nav: 9
---

The Internet is one of the most freeing ways for developers to be able to express themselves. Since web development first began, developers have been using it to unleash their creativity and push the boundaries of what a web browser is capable of. 2D development has long been the standard of developing creative content on the web, but with advances in hardware and frameworks, it is now possible to build everything from AR artwork anchored to a physical wall, to entire virtual worlds that can be explored with a VR headset, all contained and run from within a webpage. React-Three-XR is a library designed to make developing these XR experiences as simple as possible. This guide is here to help developers with a primarily 2D web development background to get up and running making 3D experiences as quickly as possible. Here are some 3D concepts that you will need to understand before moving on to developing full web applications. 

## Understanding the Basics of 3D Graphics

### Coordinate Systems

In 3D development, everything exists within a **three-dimensional coordinate system**, typically represented by three axes:

- **X-axis:** Left and right
- **Y-axis:** Up and down
- **Z-axis:** Forward and backward

All 3D objects are positioned, rotated, and scaled based on these three axes.

*Note: Some 3D editors will change which axis represents which direction, however in Three.js, X is horizontal, Y is vertical, and Z is forward and backward*

### Scenes

All 3D elements are contained inside of scenes. Typically a scene represents an environment such as a room or street. You can loosely picture scenes as levels in a video game, where each level is represented by a scene. **Cameras**, **Models**, and **Lighting** are all elements that can be found within a scene.

### Cameras 

Cameras act as the viewer's eye into the scene. Common camera types include:

- **Perspective:** (realistic, depth-based view) This is the camera most 3d games use. 
- **Orthographic:** (no depth distortion) This camera makes everything appear flat.

In React-Three-XR you typically do not have to worry about the camera much as the user's device is usually acting as the camera, and they control where it points.

### Models, Meshes, Materials, and Geometry

Objects in 3D space are known as 3D models. A 3D model in the context of Three.js typically includes the following elements: 

- **Models:** Models are the wrapper for all of the components of a 3D object
	- **Meshes**: Meshes are the fundamental building blocks of 3D elements. They include the following properties:
		- **Geometry:** Geometry defines the shape of an object (cube, sphere, plane).
		- **Materials:** Materials control how the surface of a geometry looks (color, reflectivity, texture).
	- **Armature:** The Armature represents any bones and joints that your model might have.
	- **Animations:** Animations are saved onto your model and can be played in your scene.

### Lighting

Lighting brings your 3D scene to life, providing depth and realism. Common light types are:

- **Ambient:** Soft, global illumination.
- **Directional:** Simulates sunlight, casting parallel rays.
- **Point:** Emits light in all directions from a single point.

There are other lighting types but they are typically less common. [You can find the full list here](https://threejs.org/manual/#en/lights)

## How Does React Three XR Fit In?

**React-Three-XR** bridges traditional React development with immersive WebXR technologies (VR and AR). It is built upon:

- **React Three Fiber:** Allows you to use Three.js with the familiar React framework. 3D elements are created and organized as React components.
- **WebXR:** Enables virtual and augmented reality experiences directly within web browsers.

React-Three-XR also includes a number of helpful pre built components that make getting started with XR development in the web much easier


### Simple Example of React Three Fiber XR

Here's a basic example of a React Three Fiber XR scene:

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';

const store = createXRStore()

export const App = () => {
  return (
    <>
      <button onClick＝{() => store.enterAR()}/>
      <Canvas>
        <XR>
          <ambientLight />
          <mesh position={[0, 0, -2]}>
            <boxGeometry />
            <meshStandardMaterial color="blue" />
          </mesh>
        </XR>
      </Canvas>
    </>
  );
}
```

In this example:

- `<Canvas>` Sets up the rendering context. WebXR scenes all exist within an HTML canvas.
- `<XR>` Wraps your XR-enabled components.
- `<button>` Provides a button for you user to enter your scene on an XR enabled device.
- `<mesh>` Creates a box and inserts it into your scene.
- `<ambientLight>` Puts a light into your scene so that your objects can be seen.

## Next Steps

This guide has armed you with the basic knowledge that you need to understand how a 3D scene is structured. From here you should be able to check out some of the other tutorials found on this site and start making your own XR experiences on the web. Happy coding :)

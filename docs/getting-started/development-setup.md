---
title: Development Setup
description: Setup your development environment for building XR experiences.
nav: 2
---

Building WebXR experiences has all the advantages of building for the web, with a lot of tool chains, debugging tools, and resources available. 
Because there are so many tools available, it is often hard to choose a development setup. Therefore, we would like to recommend you a development setup for developing with `react-three/xr`.

## 1. Build tool: [vite](https://vitejs.dev/)

Vite is easy to set up and has all the features we need. We recommend using the packages `@vitejs/plugin-react` to enable hot module reloading and `@vitejs/plugin-basic-ssl` to enable `https`, which is required for any WebXR experience.

A basic `vite.config.ts` would look like this:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
})
```

## 2. emulator: [iwer/devui](https://github.com/meta-quest/immersive-web-emulation-runtime/tree/main/devui)

Developing WebXR experiences often requires testing WebXR-specific features, which either require an actual device or an emulator. An emulator allows testing without a specific device and without continuously switching a headset on and off.

`react-three/xr` includes the [iwer/devui](https://github.com/meta-quest/immersive-web-emulation-runtime/tree/main/devui) emulator out of the box. The emulator builds on [IWER by meta](https://github.com/meta-quest/immersive-web-emulation-runtime/) and adds a easy to use overlay on top of your application. The emulator is activated if no WebXR support is detected on `localhost` or by pressing `Window/Command + Alt/Option + E`.

![iwer/devui](./emulator.gif)

The existing [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik) and the previous [WebXR API Emulator](https://chromewebstore.google.com/detail/webxr-api-emulator/mjddjgeghkdijejnciaefnkjmkafnnje?hl=de) are not supported because they do not comply to the WebXR spec. If you have one of those installed and active, please turn them off, as they will prevent activiting the built-in emulator. 

Another supported alternative is the Apple Vision Pro Simulator.

### 3. ADB

Sometimes, a WebXR experience works floorless in the emulator but fails on the actual device. In this case we recommend using Android Device Bridge (ADB) to debug your experience from another device. For example, to remotely debug a WebXR experience on a Meta Quest 3, the Meta Quest 3 must be in developer mode, and remote debugging must be enabled. Then, the Meta Quest 3 must be connected to a PC via a USB cable with ADB installed. With this setup, the Chrome browser can now be used to access `chrome://inspect` to inspect specific tabs on the device remotely.

If you are using the Apple Vision Pro, there are similar features to remotely debug a WebXR experience on the Apple Vision Pro from a Safari browser on another device. 
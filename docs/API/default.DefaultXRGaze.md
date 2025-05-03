---
title: DefaultXRGaze
nav: 6
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRGaze**(`options`): `Element`

default gaze implementation with ray pointer

properties
- `clickThresholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
- `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
- `contextMenuButton` the button that triggers contextmenu events
- `minDistance` minimal distance to trigger interactions
- `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
- `direction` the direction of the ray
- `cursorModel` properties for configuring how the cursor should look

## Parameters

### options

`DefaultXRGazeOptions`

## Returns

`Element`

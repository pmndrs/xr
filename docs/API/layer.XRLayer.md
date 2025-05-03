---
title: XRLayer
nav: 76
sourcecode: packages/react/xr/src/layer.tsx
---

> **XRLayer**(`props`): `null` \| `Element`

Component for rendering high quality quad, cylinder, or equirectangular layers inside supported sessions. Also includes a fallback for non-supported sessions.

## Parameters

### props

`XRLayerProperties`

* `src`: Property for displaying images and videos onto the layer. For rendering dynamic content to the layer, leave the `src` empty and put the dynamic (3D) content into the children, so that the layer acts as a render target.
* `shape`: Property to configure the shape of the layer ("quad", "cylinder", "equirectangular").
* `layout`: Property to configure the layout of the display content for stereo content ("default", "mono", "stereo-left-right", "stereo-top-bottom").
* `centralAngle`: Property to configure the central angle in case the layer shape is a "cylinder".
* `centralHorizontalAngle`: Property to configure the central horizontal angle in case the layer shape is "equirectangular".
* `upperVerticalAngle`: Property to configure the upper vertical angle in case the layer shape is "equirectangular".
* `lowerVerticalAngle`: Property to configure the lower verical angle in case the layer shape is "equirectangular".
* `chromaticAberrationCorrection`: Property to configure whether chromatic abberration should be corrected by the layer.
* `quality`: Property to configure for what type of content the layer should be optimized ("default", "text-optimized", "graphics-optimized").

## Returns

`null` \| `Element`

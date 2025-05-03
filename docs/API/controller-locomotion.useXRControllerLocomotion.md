---
title: useXRControllerLocomotion
nav: 46
sourcecode: packages/react/xr/src/controller-locomotion.ts
---

> **useXRControllerLocomotion**(`target`, `translationOptions`, `rotationOptions`, `translationControllerHand`): `void`

A hook for handling basic locomotion in VR

## Parameters

### target

Either a `THREE.Group` ref, or a callback function. Recieves movement input (required).

`RefObject`\<`null` \| `Object3D`\<`Object3DEventMap`\>\> | (`velocity`, `rotationVelocityY`, `deltaTime`, `state`, `frame?`) => `void`

### translationOptions

`XRControllerLocomotionTranslationOptions` = `{}`

Options that control the translation of the user. Set to `false` to disable.

### rotationOptions

`XRControllerLocomotionRotationOptions` = `{}`

Options that control the rotation of the user. Set to `false` to disable.

### translationControllerHand

Specifies which hand will control the movement. Can be either 'left' or 'right'.

`"left"` | `"right"`

## Returns

`void`

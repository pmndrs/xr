---
title: Handle Component  
description: The Handle and HandleTarget components and their properties  
nav: 25  
---

The `Handle` component is the core component of the `@react-three/handle` library, which is built on the `HandleStore`. This store provides developers with more control over the current state and user interactions.

## Handle Store

The handle store manages the handle's state and translates user interactions into state modifications.

### Exposed Functions

**getState**  
Allows retrieval of the state of the current interaction. If no interaction is currently happening, `getState` returns `undefined`.

**capture**  
Normally, a pointer is captured when the user interacts with an object. The `capture` method allows programmatic initiation of an interaction without requiring user input.

**save**  
Allows saving the current state so that modifications to the handle options do not affect modifications from previous interactions.

**cancel**  
Normally, an interaction is canceled when the user releases the button that started the interaction. The `cancel` function allows programmatic cancellation of the interaction.

## Handle Component

**Example**
```tsx
<Handle translate="as-scale" scale={{ uniform: true }}>
    <mesh>
        <boxGeometry />
    </mesh>
</Handle>
```
*Allows scaling of the cube by dragging it outward from the cube's center.*

### Properties

**handleRef**  
Allows overriding to pass a custom handle object.

**targetRef**  
Allows to pass in a ref to an object that should be the target of the handle. Alternatively `targetRef` can be set to `"from-context"` use the target provided by a surrounding `HandleTarget` component.

**getHandleOptions**  
Allows passing a function that dynamically generates options to override the current handle options.

**bind**  
Allows disabling automatic binding of the event listeners to the provided handle, which can be necessary when capturing pointers manually.

**apply**  
The `apply` function is used to apply a state modification that originates from a user interaction to the state. This property allows overriding the default apply function, giving the developer complete control over how modifications affect the state. For instance, instead of applying the modification directly, the developer can apply it to their own state management solution. The state management solution can then apply the modification to the handle target.

**projectRays**  
Allows to configure whether rays from input devices should be projected onto the interaction space (3D plane or 3D Line).

**alwaysUpdate**  
In situations where the handle target is placed inside a constantly changing group, the `alwaysUpdate` flag ensures that the handle target's transformation is updated every frame to reflect the current state of the handle.

**multitouch**  
By default, handles can be interacted with using multiple input devices. By setting `multitouch` to `false`, only the first input device will be used.

**stopPropagation**  
By default, events that occur on handles are not propagated upwards and therefore do not reach their ancestors. Setting `stopPropagation` to `false` will re-enable event propagation for events that occur on the handle.

**rotate**  
The `rotate` property allows configuring if and how the user can rotate the target. Setting `rotate` to `false` disables rotation. Setting `rotate` to `x` restricts rotation to the x-axis. Setting `rotate` to `{ x: false, y: [0, Math.PI] }` disables rotation on the x-axis and restricts rotation on the y-axis to be between 0 and 180°, while rotation on the z-axis is enabled.

**scale**  
The `scale` property allows configuring if and how the user can scale the target. Setting `scale` to `false` disables scaling. Setting `scale` to `x` restricts scaling to the x-axis. Setting `scale` to `{ x: false, y: [1, 2] }` disables scaling on the x-axis and restricts the scaling factor on the y-axis to be between 1 and 2, while scaling on the z-axis is enabled.

**translate**  
The `translate` property allows configuring if and how the user can translate the target. Setting `translate` to `false` disables translation. Setting `translate` to `x` restricts translation to the x-axis. Setting `translate` to `{ x: false, y: [-1, 1] }` disables translation on the x-axis and restricts translation on the y-axis to be between -1 and 1, while translation on the z-axis is enabled. Furthermore, the `translate` property can be configured to transform translations into rotations and/or scalings using `translate="as-scale"`, allowing the user to scale the target by grabbing and moving the handle.

**ref**  
Allows retrieval of a reference to the internal handle store (`<Handle ref={handleStoreRef}>`).

## Handle Target Component

The `HandleTarget` component allows declaratively specifying a handle target that is hierarchically above the `Handle` component. To prevent accidentally providing a different target to a handle, using the target from the context requires setting `targetRef="from-context"` on the `Handle` component.

**Example**
```tsx
<HandleTarget>
    <group>
        <mesh>
            <boxGeometry />
            <Handle targetRef="from-context">
                <mesh position-x={2}>  
                    <boxGeometry />
                </mesh>
            </Handle>
        </mesh>
    </group>
</HandleTarget>
```
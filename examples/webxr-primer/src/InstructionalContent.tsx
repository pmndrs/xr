import { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { SelectableComponents } from "./SelectableComponents.enum";

export const InstructionalContent: Record<SelectableComponents, ReactNode> = {
  [SelectableComponents.default]: (
    <>
      <h2>{"WebXR Spaces"}</h2>
      <span>
        {
          "This is an interactive demo designed to give a quick primer on how the various "
        }
      </span>
      <a
        target="_blank"
        href="https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Spatial_tracking"
      >
        {"spaces"}
      </a>
      <span>{" that exist inside WebXR function. "}</span>
      <br />
      <br />
      <span>
        {
          "In its simplest form, a space in WebXR is nothing more than an unbounded coordinate system. You can picture a space as an unconnected (xyz) gimbal. In order for a space to mean anything, it must be related to another space. This relation is represented by a 4x4 matrix."
        }
      </span>
      <br />
      <br />
      <span>
        {
          "Select an element to learn more about which spaces it occupies, how it interacts in those spaces, and how its space relates to other spaces."
        }
      </span>
    </>
  ),
  [SelectableComponents.controllers]: (
    <>
      <h2>{"Controllers"}</h2>
      <span>{"The controllers contain their own XRSpace called a "}</span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gripSpace"
      >
        gripSpace
      </a>
      <span>
        {
          ". This space relates to the <XROrigin/> component and uses that to calculate its world transformation. The calculation of the controllers' location looks something like this:"
        }
      </span>
      <br />
      <br />
      <CodeBlock>
        {
          "WorldControllerTransformation = XROriginTransformation * TransformationBetween(XROriginSpace, XRControllerSpace)"
        }
      </CodeBlock>
      <br />
      <br />
      <ul>
        <li>
          {
            "XROriginTransformation: Any movement that the Origin has had within the XROriginSpace"
          }
        </li>
        <li>
          {"XROriginSpace: The space that represents the origin of the scene"}
        </li>
        <li>{"XRControllerSpace: The space in which the Controllers exist"}</li>
      </ul>
    </>
  ),
  [SelectableComponents.person]: (
    <>
      <h2>{"Person"}</h2>
      <span>
        {
          "Probably the simplest element of an XR scene. This is just the person using the devices that interact with your scene. Typically the user is not tracked at all except in the case that hand tracking is enabled and the user is not using controllers. In that case the hands are tracked using an "
        }
      </span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRHand"
      >
        {"XRHand"}
      </a>
      <span>{" space."}</span>
    </>
  ),
  [SelectableComponents.ball]: (
    <>
      <h2>{"Virtual Ball"}</h2>
      <span>
        {
          "This object represents a mesh created in your 3D scene. As it is fully virtual and doesn't rely on being statically positioned anywhere in the scene, it does not reside inside of any specific spaces, but belongs to the 3D space itself. It is still able to collide and interact with spacially tracked objects due to their world transformations, however the ball is not specifically spacially tracked itself."
        }
      </span>
    </>
  ),
  [SelectableComponents.room]: (
    <>
      <h2>{"Room"}</h2>
      <span>
        {
          "This represents the physical space that the user is in. By default, the only thing that is tracked here is the floor level, however WebXR also allows for tracking the general shape of the environment that the user is in, as well as for tracking specific points within the user's physical space. The environment's shape can be obtained by toggling "
        }
      </span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRDepthInformation"
      >
        {"depth sensing"}
      </a>
      <span>
        {", and specific points around the room can be tracked with "}{" "}
      </span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRAnchor/anchorSpace"
      >
        {"anchor"}
      </a>
      <span> {" spaces."}</span>
      <br />
      <br />
      <span>
        {
          'By accessing the depth sensing information, you can generate meshes for your virtual objects to interact with, and anchor spaces provide locations to "pin" virtual objects to that will not move as the user moves around their space. '
        }
      </span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRHitTestResult"
      >
        {"Hit-testing"}
      </a>
      <span>
        {
          " is also available for quickly checking for objects in the physical world such as walls and surfaces."
        }
      </span>
    </>
  ),
  [SelectableComponents.origin]: (
    <>
      <h2>{"Origin"}</h2>
      <span>
        {
          "This is where most of the magic happens. All other spaces in a WebXR environement use the origin space as a reference to calculate their own transforms. Typically this space is a "
        }
      </span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace#reference_space_types"
      >
        {"Reference Space"}
      </a>
      <span>{" as all of the other spaces will reference it."}</span>
      <br />
      <br />
      <span>
        {
          ' In react-three-xr, a lot of the complexities of dealing with these spaces, and setting up the origin space are abstracted away in the <XROrigin /> component. The <XROrigin /> component by default sets up a local-floor XRReferenceSpace, and provides a convienent way for developers to "move" their users around their virtual environment.'
        }
      </span>
    </>
  ),
  [SelectableComponents.headset]: (
    <>
      <h2>{"Headset"}</h2>
      <span>{"The headset is represented by a "}</span>
      <a
        target={"_blank"}
        href="https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace#viewer"
      >
        {"viewer space"}
      </a>
      <span>
        {
          " and can be thought of as the camera for the scene. However unlike most cameras in 3D software, in WebXR the programmer should not directly move this camera as it is controlled by the position of the VR headset attached to the user's head. The headset's world space is calculated similar to how the controller's world space is calculated using the origin as a reference."
        }
      </span>
    </>
  ),
  [SelectableComponents.picture]: (
    <>
      <h2>{"Virtual Picture"}</h2>
      <span>
        {
          "This virtual picture hanging on the wall is tracked using an anchor space. Unlike the virtual ball, this picture is actively being tracked inside the physical space, and it is important that it remain in the specific space that it is placed in. An anchor space insures that the picture is glued to that position on the wall and will not move."
        }
      </span>
    </>
  ),
};

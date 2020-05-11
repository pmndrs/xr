import * as React from "react";
import { WebGLRenderer, Group } from "three";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
import { useThree } from "react-three-fiber";
import { XRInputSource } from "./webxr";

interface XRController {
  inputSource?: XRInputSource;
  /**
   * Group with orientation that should be used to render virtual
   * objects such that they appear to be held in the user’s hand
   */
  grip: Group;
  /** Group with orientation of the preferred pointing ray */
  controller: Group;
}
const XRController = {
  make: (id: number, gl: WebGLRenderer): XRController => {
    const controller = gl.xr.getController(id);
    const grip = gl.xr.getControllerGrip(id);

    const xrController = {
      inputSource: undefined,
      grip,
      controller,
    };

    controller.addEventListener("connected", (e) => {
      xrController.inputSource = e.data;
    });

    return xrController;
  },
};

const XRControllersContext = React.createContext<XRController[]>([]);
export function XRControllers(props: { children: React.ReactNode }) {
  const { gl } = useThree();
  const [controllers, setControllers] = React.useState<XRController[]>([]);

  React.useEffect(() => {
    setControllers([0, 1].map((id) => XRController.make(id, gl)));
  }, [gl]);

  return (
    <XRControllersContext.Provider value={controllers}>
      {props.children}
    </XRControllersContext.Provider>
  );
}

export const useXRControllers = () => React.useContext(XRControllersContext);

export function DefaultXRControllerModels() {
  const controllers = useXRControllers();

  const modelFactory = React.useMemo(() => new XRControllerModelFactory(), []);

  const models = React.useMemo(
    () =>
      controllers.map((it) => {
        const model = modelFactory.createControllerModel(it.controller);

        return (
          <primitive object={it.grip} key={it.grip.id}>
            <primitive object={model} />
          </primitive>
        );
      }),
    [controllers, modelFactory]
  );

  return <>{models}</>;
}

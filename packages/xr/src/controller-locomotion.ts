import { Vector3, Quaternion, Euler, MathUtils, Object3D, Camera } from 'three'
import { XRControllerState, XRInputSourceState, XRStore } from './internals.js'

export type ControllerLocomotionTranslationOptions =
  | {
      speed?: number
    }
  | boolean
export type ControllerLocomotionRotationOptions =
  | ({
      deadZone?: number
    } & ({ type?: 'snap'; degrees?: number } | { type: 'smooth'; speed?: number }))
  | boolean

// useControllerLocomotion defaults and constants
const defaultSpeed = 2
const defaultSmoothTurningSpeed = 2
const defaultSnapDegrees = 45
const defaultDeadZone = 0.5
const thumbstickPropName = 'xr-standard-thumbstick'

const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()
const eulerHelper = new Euler()

/**
 * function for handling controller based locomotion in VR
 * @param target Either a `Object`, or a callback function. Recieves translation and rotation input (required).
 * @param translationOptions Options that control the translation of the user. Set to `false` to disable.
 * @param translationOptions.speed The speed at which the user moves.
 * @param rotationOptions Options that control the rotation of the user. Set to `false` to disable.
 * @param rotationOptions.deadZone How far the joystick must be pushed to trigger a turn.
 * @param rotationOptions.type Controls how rotation using the controller functions. Can be either 'smooth' or 'snap'.
 * @param rotationOptions.degrees If `type` is 'snap', this specifies the number of degrees to snap the user's view by.
 * @param rotationOptions.speed If `type` is 'smooth', this specifies the speed at which the user's view rotates.
 * @param translationControllerHand Specifies which hand will control the translation. Can be either 'left' or 'right'.
 */
export function createControllerLocomotionUpdate() {
  let canRotate = true
  return <T extends Array<any>>(
    target: Object3D | undefined | null | ((velocity: Vector3, rotationVelocityY: number, ...params: T) => void),
    store: XRStore<any>,
    camera: Camera,
    delta: number,
    translationOptions: ControllerLocomotionTranslationOptions = {},
    rotationOptions: ControllerLocomotionRotationOptions = {},
    translationControllerHand: Exclude<XRHandedness, 'none'> = 'left',
    ...params: T
  ) => {
    const { inputSourceStates } = store.getState()
    const rotationControllerHand = translationControllerHand === 'left' ? 'right' : 'left'
    const translationController = inputSourceStates.find<XRControllerState>((state) =>
      isControllerWithHandedness(state, translationControllerHand),
    )
    const rotationController = inputSourceStates.find<XRControllerState>((state) =>
      isControllerWithHandedness(state, rotationControllerHand),
    )
    if (translationController == null || rotationController == null) {
      return
    }

    const translationThumbstickState = translationController.gamepad[thumbstickPropName]
    const translationXAxis = translationThumbstickState?.xAxis ?? 0
    const translationYAxis = translationThumbstickState?.yAxis ?? 0

    const rotationXAxis = rotationController.gamepad[thumbstickPropName]?.xAxis ?? 0

    //handle rotation
    let yRotationChange: number | undefined
    if (rotationOptions !== false) {
      if (rotationOptions === true) {
        rotationOptions = {}
      }
      if (rotationOptions.type === 'smooth') {
        if (Math.abs(rotationXAxis) > (rotationOptions.deadZone ?? defaultDeadZone)) {
          yRotationChange = (rotationXAxis < 0 ? -1 : 1) * delta * (rotationOptions.speed ?? defaultSmoothTurningSpeed)
        }
      } else {
        if (Math.abs(rotationXAxis) < (rotationOptions.deadZone ?? defaultDeadZone)) {
          canRotate = true
        } else if (canRotate) {
          canRotate = false
          yRotationChange =
            (rotationXAxis > 0 ? -1 : 1) * MathUtils.degToRad(rotationOptions.degrees ?? defaultSnapDegrees)
        }
      }
    }

    //handle translation
    const translationChanged = translationXAxis != 0 || translationYAxis != 0
    if (translationOptions !== false && translationChanged) {
      if (translationOptions === true) {
        translationOptions = {}
      }
      const { speed = defaultSpeed } = translationOptions
      vectorHelper.set(translationXAxis * speed, 0, translationYAxis * speed)
      vectorHelper.applyQuaternion(camera.getWorldQuaternion(quaternionHelper))

      if (yRotationChange) {
        vectorHelper.applyEuler(eulerHelper.set(0, yRotationChange, 0, 'YXZ'))
      }
    }

    if (!translationChanged && yRotationChange == null) {
      return
    }

    //apply translation and rotation:

    if (typeof target === 'function') {
      target(vectorHelper, yRotationChange ?? 0, ...params)
      return
    }

    if (target == null) {
      return
    }

    target.position.x += vectorHelper.x * delta
    target.position.z += vectorHelper.z * delta
    target.rotation.y += yRotationChange ?? 0
  }
}

function isControllerWithHandedness(state: XRInputSourceState, handedness: XRHandedness): state is XRControllerState {
  return state.type === 'controller' && state.inputSource.handedness === handedness
}

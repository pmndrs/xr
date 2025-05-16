import { DevUI } from '@iwer/devui'
import { SyntheticEnvironmentModule } from '@iwer/sem'
import { XRDevice, metaQuest3, metaQuest2, metaQuestPro, oculusQuest1 } from 'iwer'
import { Euler, Quaternion, Vector3, Vector3Tuple, Vector4Tuple } from 'three'
import type { XRDeviceOptions } from 'iwer/lib/device/XRDevice'

const configurations = { metaQuest3, metaQuest2, metaQuestPro, oculusQuest1 }

export type EmulatorType = keyof typeof configurations

export type EmulatorTransformationOptions = {
  position?: Vector3 | Vector3Tuple
  rotation?: Euler | Vector3Tuple
  quaternion?: Quaternion | Vector4Tuple
}

export type DefaultSyntheticEnvironment =
  | 'meeting_room'
  | 'living_room'
  | 'music_room'
  | 'office_large'
  | 'office_small'

const defaultSyntheticEnvironments: Array<DefaultSyntheticEnvironment> = [
  //default default environment:
  'office_small',
  'meeting_room',
  'living_room',
  'music_room',
  'office_large',
]

export type EmulatorOptions =
  | EmulatorType
  | ({
      type?: EmulatorType
      primaryInputMode?: XRDevice['primaryInputMode']
      headset?: EmulatorTransformationOptions
      inject?: boolean | { hostname: string }
      controller?: Partial<Record<XRHandedness, EmulatorTransformationOptions>>
      hand?: Partial<Record<XRHandedness, EmulatorTransformationOptions>>
      syntheticEnvironment?: null | boolean | JSON | (string & {}) | DefaultSyntheticEnvironment
    } & Partial<Pick<XRDeviceOptions, 'ipd' | 'fovy' | 'stereoEnabled' | 'canvasContainer'>>)

const handednessList: Array<XRHandedness> = ['left', 'none', 'right']

export function emulate(options: EmulatorOptions) {
  const type = typeof options === 'string' ? options : (options.type ?? 'metaQuest3')
  const xrdevice = new XRDevice(configurations[type], typeof options === 'string' ? undefined : options)
  if (typeof options != 'string') {
    applyEmulatorTransformOptions(xrdevice, options.headset)
    applyEmulatorInputSourcesOptions(xrdevice.hands, options.hand)
    applyEmulatorInputSourcesOptions(xrdevice.controllers, options.controller)
    xrdevice.primaryInputMode = options.primaryInputMode ?? 'controller'
  }
  xrdevice.ipd = typeof options === 'string' ? 0 : (options.ipd ?? 0)
  xrdevice.installRuntime()
  xrdevice.installDevUI(DevUI)
  const syntheticEnvironment = typeof options === 'string' ? true : options.syntheticEnvironment
  if (syntheticEnvironment === false) {
    return xrdevice
  }

  xrdevice.installSEM(SyntheticEnvironmentModule)

  if (syntheticEnvironment === null) {
    //dont preload any environment
    return xrdevice
  }

  if (typeof syntheticEnvironment === 'string' && defaultSyntheticEnvironments.includes(syntheticEnvironment as any)) {
    //load the selected default environment
    xrdevice.sem?.loadDefaultEnvironment(syntheticEnvironment)
    return xrdevice
  }

  if (syntheticEnvironment === true || syntheticEnvironment === undefined) {
    //load the first default environment
    xrdevice.sem?.loadDefaultEnvironment(defaultSyntheticEnvironments[0])
    return xrdevice
  }

  if (typeof syntheticEnvironment === 'object') {
    //load the provided environment
    xrdevice.sem?.loadEnvironment(syntheticEnvironment)
    return xrdevice
  }

  //fetch the environment from the provided link
  fetch(syntheticEnvironment)
    .then((response) => response.json())
    .then((environment) => xrdevice.sem?.loadEnvironment(environment))
    .catch(console.error)

  return xrdevice
}

const eulerHelper = new Euler()
const quaternionHelper = new Quaternion()

function applyEmulatorInputSourcesOptions(
  xrInputSources: XRDevice['controllers'] | XRDevice['hands'],
  options: Partial<Record<XRHandedness, EmulatorTransformationOptions>> | undefined,
) {
  if (options == null) {
    return
  }
  for (const handedness of handednessList) {
    applyEmulatorTransformOptions(xrInputSources[handedness], options[handedness])
  }
}

function applyEmulatorTransformOptions(
  target: XRDevice['controllers']['left'] | XRDevice['hands']['left'] | XRDevice,
  options: EmulatorTransformationOptions | undefined,
) {
  if (target == null || options == null) {
    return
  }
  setVector(target.position, options.position)
  setVector(eulerHelper, options.rotation)
  setQuaternion(target.quaternion, quaternionHelper.setFromEuler(eulerHelper))
  setQuaternion(target.quaternion, options.quaternion)
}

function setVector(
  target: { x: number; y: number; z: number } | Euler,
  value: Euler | Vector3 | Vector3Tuple | undefined,
) {
  if (value == null) {
    return
  }
  if (value instanceof Euler && target instanceof Euler) {
    target.copy(value)
  }
  if (Array.isArray(value)) {
    target.x = value[0]
    target.y = value[1]
    target.z = value[2]
    return
  }
  target.x = value.x
  target.y = value.y
  target.z = value.z
}

function setQuaternion(
  target: { x: number; y: number; z: number; w: number },
  value: Quaternion | Vector4Tuple | undefined,
) {
  if (value == null) {
    return
  }
  if (Array.isArray(value)) {
    target.x = value[0]
    target.y = value[1]
    target.z = value[2]
    target.w = value[3]
    return
  }
  target.x = value.x
  target.y = value.y
  target.z = value.z
  target.w = value.w
}

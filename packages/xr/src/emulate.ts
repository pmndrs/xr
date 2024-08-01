import { XRDevice, metaQuest3, metaQuest2, metaQuestPro, oculusQuest1 } from 'iwer'
import { DevUI } from '@iwer/devui'

const configurations = { metaQuest3, metaQuest2, metaQuestPro, oculusQuest1 }

export type EmulatorType = keyof typeof configurations

export function emulate(type: EmulatorType) {
  const xrdevice = new XRDevice(configurations[type])
  xrdevice.ipd = 0
  xrdevice.installRuntime()
  new DevUI(xrdevice)
}

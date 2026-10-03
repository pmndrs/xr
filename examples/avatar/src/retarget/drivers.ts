export type Side = 'left' | 'right'

export type Driver =
  | {
      type: 'basis'
      tracked: [XRBodyJoint, XRBodyJoint, XRBodyJoint, XRBodyJoint]
      rest: [string, string, string, string]
    }
  | { type: 'swing'; tracked: [XRBodyJoint, XRBodyJoint]; rest: [string, string] }
  | { type: 'reach'; target: XRBodyJoint; child: string }

export const drivers = new Map<string, Driver>()
export const torsoDrivers = {
  hips: {
    type: 'basis',
    tracked: ['hips', 'chest', 'left-upper-leg', 'right-upper-leg'],
    rest: ['hips', 'upperChest', 'leftUpperLeg', 'rightUpperLeg'],
  },
  upperChest: {
    type: 'basis',
    tracked: ['spine-middle', 'neck', 'left-arm-upper', 'right-arm-upper'],
    rest: ['chest', 'neck', 'leftUpperArm', 'rightUpperArm'],
  },
} satisfies Record<string, Driver>

function swing(bone: string, tracked: [XRBodyJoint, XRBodyJoint], rest: [string, string]) {
  drivers.set(bone, { type: 'swing', tracked, rest })
}

function reach(bone: string, target: XRBodyJoint, child: string) {
  drivers.set(bone, { type: 'reach', target, child })
}

for (const side of ['left', 'right'] as const satisfies Array<Side>) {
  const b = (name: string) => `${side}${name}` as string
  const j = (name: string) => `${side}-${name}` as XRBodyJoint

  reach(b('Shoulder'), j('arm-upper'), b('UpperArm'))
  reach(b('UpperArm'), j('arm-lower'), b('LowerArm'))
  reach(b('LowerArm'), j('hand-wrist'), b('Hand'))
  drivers.set(b('Hand'), {
    type: 'basis',
    tracked: [
      j('hand-wrist'),
      j('hand-middle-phalanx-proximal'),
      j('hand-little-phalanx-proximal'),
      j('hand-index-phalanx-proximal'),
    ],
    rest: [b('Hand'), b('MiddleProximal'), b('LittleProximal'), b('IndexProximal')],
  })

  swing(
    b('ThumbMetacarpal'),
    [j('hand-thumb-metacarpal'), j('hand-thumb-phalanx-proximal')],
    [b('ThumbMetacarpal'), b('ThumbProximal')],
  )
  swing(
    b('ThumbProximal'),
    [j('hand-thumb-phalanx-proximal'), j('hand-thumb-phalanx-distal')],
    [b('ThumbProximal'), b('ThumbDistal')],
  )
  swing(b('ThumbDistal'), [j('hand-thumb-phalanx-distal'), j('hand-thumb-tip')], [b('ThumbProximal'), b('ThumbDistal')])
  for (const [vrmFinger, xrFinger] of [
    ['Index', 'index'],
    ['Middle', 'middle'],
    ['Ring', 'ring'],
    ['Little', 'little'],
  ]) {
    const fb = (segment: string) => b(`${vrmFinger}${segment}`)
    const fj = (segment: string) => j(`hand-${xrFinger}-${segment}`)
    swing(fb('Proximal'), [fj('phalanx-proximal'), fj('phalanx-intermediate')], [fb('Proximal'), fb('Intermediate')])
    swing(fb('Intermediate'), [fj('phalanx-intermediate'), fj('phalanx-distal')], [fb('Intermediate'), fb('Distal')])
    swing(fb('Distal'), [fj('phalanx-distal'), fj('tip')], [fb('Intermediate'), fb('Distal')])
  }

  reach(b('UpperLeg'), j('lower-leg'), b('LowerLeg'))
  reach(b('LowerLeg'), j('foot-ankle'), b('Foot'))
  swing(b('Foot'), [j('foot-ankle'), j('foot-ball')], [b('Foot'), b('Toes')])
}

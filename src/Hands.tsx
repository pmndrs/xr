import { useThree } from 'react-three-fiber'
import { useEffect } from 'react'
// @ts-ignore
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory'

export function Hands() {
  const { scene, gl } = useThree()

  useEffect(() => {
    const handFactory = new XRHandModelFactory().setPath('https://threejs.org/examples/models/fbx/')

    // @ts-ignore
    const hand1 = gl.xr.getHand(0)
    scene.add(hand1)
    hand1.add(handFactory.createHandModel(hand1, 'oculus'))

    // @ts-ignore
    const hand2 = gl.xr.getHand(1)
    scene.add(hand2)
    hand2.add(handFactory.createHandModel(hand2, 'oculus'))
  }, [scene, gl])

  return null
}

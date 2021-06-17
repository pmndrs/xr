import { useThree } from '@react-three/fiber'
import { OculusHandModel } from './webxr/OculusHandModel.js'
import { useEffect } from 'react'

export function Hands(props: {
    modelLeft?:string
    modelRight?:string
  }) {
  const { scene, gl } = useThree()

  useEffect(() => {
    // @ts-ignore
    const hand1 = gl.xr.getHand(0)
    hand1.add(new OculusHandModel(hand1,[props.modelLeft,props.modelRight]))
    scene.add(hand1)

    // @ts-ignore
    const hand2 = gl.xr.getHand(1)
    hand1.add(new OculusHandModel(hand2,[props.modelLeft,props.modelRight]))
    scene.add(hand2)
  }, [scene, gl])

  return null
}

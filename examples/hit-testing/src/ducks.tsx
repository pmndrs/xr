import { useXRInputSourceEvent } from '@react-three/xr'
import { useState } from 'react'
import { Quaternion, Vector3 } from 'three'
import { hitTestMatrices } from './app.js'
import { Duck } from './duck.js'

const vectorHelper = new Vector3()

export const Ducks = () => {
  const [ducks, setDucks] = useState<Array<{ position: Vector3; quaternion: Quaternion }>>([])

  useXRInputSourceEvent(
    'all',
    'select',
    (e) => {
      const matrix = hitTestMatrices[e.inputSource.handedness]
      if (matrix) {
        const position = new Vector3()
        const quaternion = new Quaternion()

        matrix.decompose(position, quaternion, vectorHelper)
        setDucks((ducks) => [...ducks, { position, quaternion }])
      }
    },
    [],
  )

  return ducks.map((item, index) => (
    <Duck key={index} position={item.position} quaternion={item.quaternion} scale={0.2} />
  ))
}

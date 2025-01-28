import { useXRInputSourceEvent } from '@react-three/xr'
import { useState } from 'react'
import { Quaternion, Vector3 } from 'three'

import { Duck } from './duck.js'
import { hitTestMatrices } from './app.js'

export const Ducks = () => {
  const [ducks, setDucks] = useState<Array<{ position: Vector3; quaternion: Quaternion }>>([])

  useXRInputSourceEvent(
    'all',
    'select',
    (e) => {
      const matrix = hitTestMatrices[e.inputSource.handedness]
      if (matrix) {
        setDucks((ducks) => [
          ...ducks,
          {
            position: new Vector3().setFromMatrixPosition(matrix),
            quaternion: new Quaternion().setFromRotationMatrix(matrix),
          },
        ])
      }
    },

    [],
  )

  return ducks.map((item, index) => (
    <Duck key={index} position={item.position} quaternion={item.quaternion.invert()} scale={0.2} />
  ))
}

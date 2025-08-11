import { useXRStore, XRDomOverlay } from '@react-three/xr'
import { useState } from 'react'
import { useTestDistanceToFloor } from './useTestDistanceToFloor.js'

export const DomOverlay = () => {
  const [distance, setDistance] = useState<string>('')
  const testDistanceToFloor = useTestDistanceToFloor()
  const xr_store = useXRStore()

  const onTestDistanceToFloorClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const distance = await testDistanceToFloor()
    console.log('distance:', distance)
    if (distance !== undefined) {
      setDistance(`Distance to floor: ${distance.toFixed(2)} meters`)
      setTimeout(() => {
        setDistance('')
      }, 5000)
    }
    e.stopPropagation()
  }

  return (
    <XRDomOverlay>
      <h1 className={'distanceMessage'}>{distance}</h1>
      <button onClick={() => xr_store.getState().session?.end()}>Exit AR</button>
      <button className={'testDistanceToFloor'} onClick={onTestDistanceToFloorClick}>
        Test Distance to Floor
      </button>
    </XRDomOverlay>
  )
}

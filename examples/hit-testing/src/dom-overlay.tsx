import { useXRStore, XRDomOverlay } from '@react-three/xr'
import { useState, useRef } from 'react'
import { useTestDistanceToFloor } from './useTestDistanceToFloor.js'

export const DomOverlay = () => {
  const [distanceMessage, setDistanceMessage] = useState<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const testDistanceToFloor = useTestDistanceToFloor()
  const xr_store = useXRStore()

  const showMessageWithTimeout = (message: string) => {
    setDistanceMessage(message)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setDistanceMessage('')
      timeoutRef.current = null
    }, 5000)
  }

  const onTestDistanceToFloorClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const distance = await testDistanceToFloor()
    console.log('distance:', distance)

    distance !== undefined
      ? showMessageWithTimeout(`Distance to floor: ${distance.toFixed(2)} meters`)
      : showMessageWithTimeout('Unable to calculate distance. Try looking towards the floor.')

    e.stopPropagation()
  }

  return (
    <XRDomOverlay>
      <span className={'distanceMessage'}>{distanceMessage}</span>
      <button className={'exitAR'} onClick={() => xr_store.getState().session?.end()}>
        Exit AR
      </button>
      <button className={'testDistanceToFloor'} onClick={onTestDistanceToFloorClick}>
        Test Distance to Floor
      </button>
    </XRDomOverlay>
  )
}

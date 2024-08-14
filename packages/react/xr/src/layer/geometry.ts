import { createXRLayerGeometry, XRLayerShape } from '@pmndrs/xr'
import { useMemo } from 'react'

export function useXRLayerGeometry({
  centralAngle,
  centralHorizontalAngle,
  lowerVerticalAngle,
  shape,
  upperVerticalAngle,
}: {
  shape?: XRLayerShape
  centralAngle?: number
  centralHorizontalAngle?: number
  upperVerticalAngle?: number
  lowerVerticalAngle?: number
}) {
  return useMemo(
    () =>
      createXRLayerGeometry(shape ?? 'quad', {
        centralAngle,
        centralHorizontalAngle,
        lowerVerticalAngle,
        upperVerticalAngle,
      }),
    [shape, centralAngle, centralHorizontalAngle, upperVerticalAngle, lowerVerticalAngle],
  )
}

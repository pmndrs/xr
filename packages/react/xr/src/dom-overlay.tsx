import { forwardRef, HTMLProps, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import tunnel from 'tunnel-rat'
import { useXR } from './xr.js'

/**
 * Renders html elements as an overlay for handheld AR experiences
 * @param props `DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>` Props are forwarded to a `div` element
 * @function
 */
export const XRDomOverlay = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>((props, ref) => {
  const domOverlayRoot = useXR((xr) => xr.domOverlayRoot)
  const { In, Out } = useMemo(tunnel, [])
  useEffect(() => {
    if (domOverlayRoot == null) {
      return
    }
    const root = createRoot(domOverlayRoot)
    root.render(<Out />)
    return () => root.unmount()
  }, [domOverlayRoot, Out])
  return (
    <In>
      <div {...props} ref={ref} />
    </In>
  )
})

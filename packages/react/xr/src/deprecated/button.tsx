import { ButtonHTMLAttributes, forwardRef, ComponentPropsWithoutRef } from 'react'
import { XRStore } from '../xr.js'
import { useSessionModeSupported } from '../hooks.js'
import { useStore } from 'zustand'

/**
 * @deprecated use <button onClick={() => store.enterXR()}> instead
 */
export const XRButton = forwardRef<
  HTMLButtonElement,
  {
    store: XRStore
    mode: XRSessionMode
    onError?: (error: any) => void
    children?: React.ReactNode | ((status: 'unsupported' | 'exited' | 'entered') => React.ReactNode)
  } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onError'>
>(({ store, mode, onError, children, ...props }, ref) => {
  const session = useStore(store, (xr) => xr.session)
  const supported = useSessionModeSupported(mode, onError)
  return (
    <button ref={ref} {...props} onClick={() => (session != null ? session.end() : store.enterXR(mode).catch(onError))}>
      {typeof children === 'function'
        ? children(supported ? (session != null ? 'entered' : 'exited') : 'unsupported')
        : children}
    </button>
  )
})

/**
 * @deprecated use <button onClick={() => store.enterAR()}> instead
 */
export const ARButton = forwardRef<HTMLButtonElement, Omit<ComponentPropsWithoutRef<typeof XRButton>, 'mode'>>(
  (props, ref) => {
    return <XRButton ref={ref} mode="immersive-ar" {...props} />
  },
)

/**
 * @deprecated use <button onClick={() => store.enterVR()}> instead
 */
export const VRButton = forwardRef<HTMLButtonElement, Omit<ComponentPropsWithoutRef<typeof XRButton>, 'mode'>>(
  (props, ref) => {
    return <XRButton ref={ref} mode="immersive-vr" {...props} />
  },
)

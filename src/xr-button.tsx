import { useExitXRSession, useRequestXRSession } from '.'
import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { XRSessionMode } from 'webxr'

export const EnterXRButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { sessionMode: XRSessionMode; sessionInit?: any }
>(({ sessionMode, sessionInit, ...props }, ref) => {
  const enterSession = useRequestXRSession()
  return <button ref={ref} {...props} onClick={() => enterSession(sessionMode, sessionInit).catch(console.error)} />
})

export const ExitXRButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {}>((props, ref) => {
  const exitSession = useExitXRSession()
  return <button ref={ref} {...props} onClick={() => exitSession().catch(console.error)} />
})

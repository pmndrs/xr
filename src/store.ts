import { WebXRManager, XRSessionMode, XRSession } from 'three'
import create, { UseStore } from 'zustand'
import { combine } from 'zustand/middleware'
import { Navigator } from 'webxr'

declare let navigator: Navigator

type XRStateValues = {
  session: XRSession | undefined
  sessionMode: XRSessionMode | undefined
  webXRManager: WebXRManager | undefined
  sessionInit?: any
}

type XRStateFunctions = {
  registerWebXRManager: (xr: WebXRManager) => () => void
  requestXRSession: (sessionMode: XRSessionMode, sessionInit?: any) => Promise<void>
  exitXRSession: () => Promise<void>
}

export type XRState = XRStateValues & XRStateFunctions

/**
 *
 */

export function createStore(): UseStore<XRState> {
  return create(
    combine<XRStateValues, XRStateFunctions>(
      {
        session: undefined,
        sessionMode: undefined,
        webXRManager: undefined
      },
      (set, get) => ({
        registerWebXRManager: (manager) => {
          const currentWebXRManager = get().webXRManager
          if (currentWebXRManager != null) {
            throw 'cant have multiple WebXRManager in one XRSession'
          }
          set({
            webXRManager: manager
          })
          const currentSession = get().session
          if (currentSession != null) {
            manager.setSession(currentSession)
          }
          return () =>
            //unregisterWebXRManager
            set({
              webXRManager: undefined
            })
        },
        requestXRSession: async (sessionMode, sessionInit) => {
          const session = (await navigator.xr.requestSession(sessionMode, sessionInit)) as any
          get().webXRManager?.setSession(session)
          set({
            session,
            sessionMode,
            sessionInit
          })
        },
        exitXRSession: () => get().session?.end() ?? Promise.reject('no xr session present')
      })
    )
  )
}

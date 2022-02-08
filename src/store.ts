import { WebXRManager, XRSessionMode, XRSession, Group, Camera, XRInputSource, Navigator } from 'three'
import create, { UseStore } from 'zustand'
import { combine } from 'zustand/middleware'

declare let navigator: Navigator

export interface XRController {
  inputSource: XRInputSource
  /**
   * Group with orientation that should be used to render virtual
   * objects such that they appear to be held in the user’s hand
   */
  grip: Group
  /** Group with orientation of the preferred pointing ray */
  controller: Group
  /** Group with hand */
  hand: Group
}

type XRStateValues = {
  session: XRSession | undefined
  sessionMode: XRSessionMode | undefined
  webXRManager: WebXRManager | undefined
  sessionInit: any | undefined
  controllers: XRController[]
  player: Group
  camera: Camera | undefined
}

type XRStateFunctions = {
  registerWebXRManager: (xr: WebXRManager) => () => void
  requestXRSession: (sessionMode: XRSessionMode, sessionInit?: any) => Promise<void>
  exitXRSession: () => Promise<void>
  addXRController: (controller: XRController) => void
  removeXRController: (controller: XRController) => void
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
        sessionInit: undefined,
        webXRManager: undefined,
        controllers: [],
        player: new Group(),
        camera: undefined
      },
      (set, get) => ({
        addXRController: (controller) => set({ controllers: [...get().controllers, controller] }),
        removeXRController: (controller) => set({ controllers: get().controllers.filter((c) => c != controller) }),
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
              webXRManager: undefined,
              controllers: []
            })
        },
        requestXRSession: async (sessionMode, sessionInit) => {
          const session = (await navigator.xr!.requestSession(sessionMode, sessionInit)) as any
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

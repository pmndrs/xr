import React from 'react'
import { createContext, PropsWithChildren, useEffect, useMemo } from 'react'
import { createStore, XRState } from './store'
import { UseStore, StateSelector, EqualityChecker } from 'zustand'
import { XRSession } from 'three'

const XRStateContext = createContext<UseStore<XRState>>(null as any)

export function useStore() {
  const store = React.useContext(XRStateContext)
  if (!store) throw `R3FXR hooks can only be used within the XRSessionManager component!`
  return store
}

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => state as unknown as T,
  equalityFn?: EqualityChecker<T>
) {
  return useStore()(selector, equalityFn)
}

export type ImmersiveXRSessionMode = 'immersive-vr' | 'immersive-ar'

export function XRSessionManager({ children }: PropsWithChildren<any>) {
  const store = useMemo(() => createStore(), [])

  useEffect(() => {
    const listener = () => {}
    const unsubscribe = store.subscribe<XRSession | undefined>(
      (session, previousSession) => {
        if (previousSession != null) {
          previousSession.removeEventListener('end', listener)
        }
        if (session != null) {
          session.addEventListener('end', listener)
        }
      },
      ({ session }) => session
    )
    return () => {
      unsubscribe()
      store.getState().session?.removeEventListener('end', listener)
    }
  }, []) //store will not change so we don't need to add it as a dependency

  return <XRStateContext.Provider value={store}>{children}</XRStateContext.Provider>
}

import React, { FC, createContext, PropsWithChildren, useEffect, useMemo } from 'react'
import { XRController, createStore, XRState } from '.'
import { UseStore, StateSelector, EqualityChecker } from 'zustand'
import { Group, WebXRManager, XRSession } from 'three'

const XRStateContext = createContext<UseStore<XRState>>(null as any)

export function useXRStateContextBridge(): FC<PropsWithChildren<{}>> {
  const store = useStore()
  return ({ children }) => <XRStateContext.Provider value={store}>{children}</XRStateContext.Provider>
}

export function useStore() {
  const store = React.useContext(XRStateContext)
  if (!store) throw `R3FXR hooks can only be used within the XRSessionManager component!`
  return store
}

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => (state as unknown) as T,
  equalityFn?: EqualityChecker<T>
) {
  return useStore()(selector, equalityFn)
}

export type ImmersiveXRSessionMode = 'immersive-vr' | 'immersive-ar'

export function XRSessionManager({ children }: PropsWithChildren<any>) {
  const store = useMemo(() => createStore(), [])

  useEffect(() => {
    const sessionEndListener = () => store.setState({ session: undefined, sessionMode: undefined, sessionInit: undefined })

    const { addXRController, removeXRController } = store.getState()

    const controllerConnectedListener = (player: Group, controller: XRController, event: any) => {
      if (event.fake) {
        return
      }
      controller.inputSource = event.data
      player.add(controller.controller)
      player.add(controller.grip)
      player.add(controller.hand)
      addXRController(controller)
    }

    const controllerDisconnectedListener = (player: Group, controller: XRController) => {
      player.remove(controller.controller)
      player.remove(controller.grip)
      player.remove(controller.hand)
      removeXRController(controller)
    }

    let clearControllers: Array<Function> = []

    const changeWebXRManager = ({ player, webXRManager }: { player: Group; webXRManager: WebXRManager | undefined }) => {
      clearControllers.forEach((clear) => clear)
      if (webXRManager == null) {
        clearControllers = []
        return
      }
      clearControllers = [0, 1].map((id) => {
        const controller = webXRManager.getController(id)
        const grip = webXRManager.getControllerGrip(id)
        const hand = webXRManager.getHand(id)

        const xrController: XRController = {
          inputSource: undefined as any,
          grip,
          controller,
          hand
        }

        grip.userData.name = 'grip'
        controller.userData.name = 'controller'
        hand.userData.name = 'hand'

        const onConnected = controllerConnectedListener.bind(null, player, xrController)
        const onDisconnected = controllerDisconnectedListener.bind(null, player, xrController)

        controller.addEventListener('connected', onConnected)
        controller.addEventListener('disconnected', onDisconnected)

        return () => {
          controller.removeEventListener('connected', onConnected)
          controller.removeEventListener('disconnected', onDisconnected)
          removeXRController(xrController)
        }
      })
    }

    const changeSession = (session: XRSession | undefined, previousSession: XRSession | undefined) => {
      if (previousSession != null) {
        previousSession.removeEventListener('end', sessionEndListener)
      }
      if (session != null) {
        session.addEventListener('end', sessionEndListener)
      }
    }

    const unsubscribeSessionChange = store.subscribe<XRSession | undefined>(changeSession, ({ session }) => session)
    const unsubscribeWebxrManagerChange = store.subscribe<{ webXRManager: WebXRManager | undefined; player: Group }>(
      changeWebXRManager,
      ({ player, webXRManager }) => ({ player, webXRManager }),
      ({ webXRManager: manager1, player: player1 }, { webXRManager: manager2, player: player2 }) =>
        manager1 === manager2 && player1 === player2
    )
    return () => {
      const state = store.getState()
      unsubscribeSessionChange()
      unsubscribeWebxrManagerChange()
      changeSession(undefined, state.session)
      changeWebXRManager({ webXRManager: undefined, player: state.player })
    }

    // store will not change so we don't need to add it as a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <XRStateContext.Provider value={store}>{children}</XRStateContext.Provider>
}

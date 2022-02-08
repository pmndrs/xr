import { useEffect } from 'react'
import { useStore, XRController } from '.'

import { HandModel } from './webxr/HandModel.js'

export function Hands({ modelLeft, modelRight }: { modelLeft?: string; modelRight?: string }) {
  const store = useStore()

  useEffect(() => {
    const changeControllers = (controllers: Array<XRController>, previousControllers: Array<XRController>) => {
      previousControllers.forEach(({ hand }) => {
        const handModel = hand.children.find((child) => child instanceof HandModel)
        if (handModel) {
          hand.remove(handModel)
          handModel.dispose()
        }
      })
      controllers.forEach(({ hand, inputSource }) => {
        hand.add(new HandModel(hand, [modelLeft, modelRight]))

        // throwing fake event for the Oculus Hand Model so it starts loading
        hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
      })
    }
    const unsubscribe = store.subscribe<Array<XRController>>(changeControllers, ({ controllers }) => controllers)

    return () => {
      unsubscribe()
      changeControllers([], store.getState().controllers)
    }
  }, [store, modelLeft, modelRight])

  return null
}

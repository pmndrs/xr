import create, { StoreApi, UseBoundStore } from 'zustand'
import * as React from 'react'
import * as THREE from 'three'
import { XRContext, XRState } from '../context'
import { Group } from 'three'
import { XRInteractionHandler, XRInteractionType } from '@react-three/xr'

export const createStoreMock = () =>
  create<XRState>((set, get) => ({
    set,
    get,

    controllers: [],
    isPresenting: false,
    isHandTracking: false,
    player: new Group(),
    session: null,
    foveation: 0,
    referenceSpace: 'local-floor',

    hoverState: {
      left: new Map(),
      right: new Map(),
      none: new Map()
    },
    interactions: new Map(),
    hasInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
      return !!get()
        .interactions.get(object)
        ?.[eventType].some((handlerRef) => handlerRef.current)
    },
    getInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
      return get()
        .interactions.get(object)
        ?.[eventType].reduce((result, handlerRef) => {
          if (handlerRef.current) {
            result.push(handlerRef.current)
          }
          return result
        }, [] as XRInteractionHandler[])
    },
    addInteraction(object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) {
      const interactions = get().interactions
      if (!interactions.has(object)) {
        interactions.set(object, {
          onHover: [],
          onBlur: [],
          onSelect: [],
          onSelectEnd: [],
          onSelectStart: [],
          onSelectMissed: [],
          onSqueeze: [],
          onSqueezeEnd: [],
          onSqueezeStart: [],
          onSqueezeMissed: [],
          onMove: []
        })
      }

      const target = interactions.get(object)!
      target[eventType].push(handlerRef)
    },
    removeInteraction(object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) {
      const target = get().interactions.get(object)
      if (target) {
        const interactionIndex = target[eventType].indexOf(handlerRef)
        if (interactionIndex !== -1) target[eventType].splice(interactionIndex, 1)
      }
    }
  }))

export const createStoreProvider =
  (store: UseBoundStore<XRState, StoreApi<XRState>>) =>
  ({ children }: React.PropsWithChildren) =>
    <XRContext.Provider value={store} children={children} />

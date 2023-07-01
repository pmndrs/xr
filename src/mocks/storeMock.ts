import create from 'zustand'
import * as React from 'react'
import * as THREE from 'three'
import { XRState } from '../context'
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
    hasInteraction(_object: THREE.Object3D, _eventType: XRInteractionType) {
      return false
    },
    getInteraction(_object: THREE.Object3D, _eventType: XRInteractionType) {
      return []
    },
    addInteraction(_object: THREE.Object3D, _eventType: XRInteractionType, _handlerRef: React.RefObject<XRInteractionHandler>) {},
    removeInteraction(_object: THREE.Object3D, _eventType: XRInteractionType, _handlerRef: React.RefObject<XRInteractionHandler>) {}
  }))

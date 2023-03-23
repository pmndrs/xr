import * as React from 'react'
import * as THREE from 'three'
import { GetState, SetState, UseBoundStore } from 'zustand'
import { XRInteractionType, XRInteractionHandler } from './Interactions'
import { XRController } from './XRController'

export interface XRState {
  set: SetState<XRState>
  get: GetState<XRState>

  controllers: XRController[]
  isPresenting: boolean
  isHandTracking: boolean
  player: THREE.Group
  session: XRSession | null
  foveation: number
  frameRate?: number
  referenceSpace: XRReferenceSpaceType

  hoverState: Record<XRHandedness, Map<THREE.Object3D, THREE.Intersection>>
  interactions: Map<THREE.Object3D, Record<XRInteractionType, React.RefObject<XRInteractionHandler>[]>>
  hasInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => boolean
  getInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => XRInteractionHandler[] | undefined
  addInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) => void
  removeInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) => void
}

export const XRContext = React.createContext<UseBoundStore<XRState>>(null!)

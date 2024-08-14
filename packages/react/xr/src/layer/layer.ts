import { updateXRLayerProperties, updateXRLayerTransform, XRLayerEntry } from '@pmndrs/xr'
import { RefObject, useEffect, useRef } from 'react'
import { useXRStore, XRStore } from '../xr.js'
import { useFrame } from '@react-three/fiber'
import { Mesh, Object3D } from 'three'

export function useXRLayer<P extends { centralAngle?: number }>(
  ref: RefObject<Mesh>,
  renderOrder: number,
  createLayer: (
    store: XRStore,
    object: Object3D,
    layerProperties: P,
  ) => Promise<XRCylinderLayer | XRQuadLayer | XREquirectLayer | undefined>,
  layerProperties: P,
  onLoaded?: (entry: XRLayerEntry) => () => void,
): RefObject<XRLayerEntry | undefined> {
  const store = useXRStore()
  const layerPropertiesRef = useRef(layerProperties)
  layerPropertiesRef.current = layerProperties
  const layerEntryRef = useRef<XRLayerEntry | undefined>(undefined)
  const renderOrderRef = useRef(renderOrder)
  renderOrderRef.current = renderOrder

  //create layer
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    let aborted = false
    let cleanup: (() => void) | undefined
    createLayer(store, ref.current, layerPropertiesRef.current).then((layer) => {
      if (layer == null || aborted) {
        return
      }
      const layerEntry = (layerEntryRef.current = { layer, renderOrder: renderOrderRef.current })
      store.addLayerEntry(layerEntry)
      const customCleanup = onLoaded?.(layerEntry)
      cleanup = () => {
        customCleanup?.()
        store.removeLayerEntry(layerEntry)
        layer.destroy()
      }
    })
    return () => {
      aborted
      cleanup?.()
    }
  }, [createLayer, onLoaded, ref, store])

  //update render order
  if (layerEntryRef.current != null) {
    layerEntryRef.current.renderOrder = renderOrder
  }

  //update layer properties
  if (layerEntryRef.current != null) {
    updateXRLayerProperties(layerEntryRef.current.layer, layerPropertiesRef.current)
  }

  //update layer transform
  useFrame(() => {
    if (layerEntryRef.current == null || ref.current == null) {
      return
    }
    updateXRLayerTransform(
      store.getState(),
      layerEntryRef.current.layer,
      layerPropertiesRef.current.centralAngle,
      ref.current,
    )
  })

  return layerEntryRef
}

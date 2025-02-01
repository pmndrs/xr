import { BoxGeometry, ColorRepresentation, Mesh, MeshBasicMaterial } from 'three'
import { Axis } from '../../state.js'
import { HandlesContext } from '../context.js'
import { RegisteredHandle } from '../registered.js'
import { HandlesProperties, handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../index.js'
import { extractHandleTransformOptions } from '../utils.js'

export class FreeScaleHandle extends RegisteredHandle {
  constructor(context: HandlesContext) {
    super(context, 'xyz', '', () => ({
      scale: { uniform: true, ...this.options },
      rotate: false,
      translate: 'as-scale',
      multitouch: false,
    }))
  }

  bind(config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options

    //visualization
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      opacity: 0.25,
      hoverOpacity: 1,
      color: 0xffffff,
      hoverColor: 0xffff00,
    })
    const visualizationMesh = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), material)
    visualizationMesh.renderOrder = Infinity
    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new BoxGeometry(0.2, 0.2, 0.2))
    interactionMesh.visible = false
    interactionMesh.pointerEventsOrder = Infinity
    this.add(interactionMesh)

    const unregister = this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      interactionMesh.geometry.dispose()
      visualizationMesh.geometry.dispose()
      unregister()
      cleanupHover?.()
      this.remove(interactionMesh)
      this.remove(visualizationMesh)
    }
  }
}

/*import { HandleTransformOptions } from '@pmndrs/handle'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { Vector3Tuple } from 'three'
import { useExtractHandleTransformOptions } from '../utils.js'

export function FreeScaleControl({ enabled }: { enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>> }) {
  const scaleOptions = useExtractHandleTransformOptions('xyz', enabled)
  if (scaleOptions === false) {
    return null
  }
  return (
    <>
      <RegisteredHandle
        tag="xyz"
        translate="as-scale"
        rotate={false}
        scale={{ uniform: true, ...scaleOptions }}
        multitouch={false}
      >
        <mesh pointerEventsOrder={Infinity} visible={false}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
        </mesh>
      </RegisteredHandle>
      <mesh renderOrder={Infinity}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <MeshHandlesContextMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}*/

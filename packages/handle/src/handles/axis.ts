import { BufferGeometry, Euler, Float32BufferAttribute, LineBasicMaterial, LineSegments, Quaternion } from 'three'
import { HandlesContext } from './context.js'
import { handleXRayMaterialProperties } from './material.js'

const quaternionHelper = new Quaternion()

const geometry = new BufferGeometry()
geometry.setAttribute('position', new Float32BufferAttribute([-1e3, 0, 0, 1e3, 0, 0], 3))

export class HandlesAxisHighlight extends LineSegments<BufferGeometry, LineBasicMaterial> {
  constructor(
    private readonly context: HandlesContext,
    private readonly rotationOffset: Euler,
  ) {
    super(geometry)
    this.renderOrder = Infinity
  }

  update() {
    this.quaternion.setFromEuler(this.rotationOffset)

    const target = this.context.getTarget()
    if (this.context.getSpace() === 'world' && target != null) {
      target.getWorldQuaternion(quaternionHelper).invert()
      this.quaternion.premultiply(quaternionHelper)
    }
  }

  bind(tag: string) {
    this.material = new LineBasicMaterial({
      ...handleXRayMaterialProperties,
      color: this.material.color ?? 'white',
      opacity: this.material.opacity ?? 1,
    })

    const unsubscribeHover = this.context.subscribeHover((tags) => {
      const isHovered = tags.some((activeTag) => activeTag.includes(tag))
      this.visible = isHovered
    })
    const unsubscribeApply = this.context.subscribeApply((_, state) => {
      if (state.last) {
        this.position.set(0, 0, 0)
        return
      }
      this.position.copy(state.initial.position).sub(state.current.position)
      const target = this.context.getTarget()
      if (target != null) {
        quaternionHelper.copy(target.quaternion).invert()
        this.position.applyQuaternion(quaternionHelper)
      }
    })
    return () => {
      this.material.dispose()
      unsubscribeHover()
      unsubscribeApply()
    }
  }
}

import { Object3D } from 'three'
import { ControlsContext } from './context.js'

export function setupControlsAxis(object: Object3D, context: ControlsContext, tag: string): () => void {
  const unsubscribeHover = context.subscribeHover((tags) => {
    const isHovered = tags.some((activeTag) => activeTag.includes(tag))
    object.visible = isHovered
  })
  const unsubscribeApply = context.subscribeApply((_, state) => {
    if (state.last) {
      object.position.set(0, 0, 0)
      return
    }
    object.position.copy(state.initial.position).sub(state.current.position)
  })
  return () => {
    unsubscribeHover()
    unsubscribeApply()
  }
}

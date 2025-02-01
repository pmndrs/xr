import { Euler, Group, OrthographicCamera, PerspectiveCamera } from 'three'
import { HandlesContext } from './context.js'
import { HandlesAxisHighlight } from './axis.js'
import { TranslateHandles } from './translate/index.js'
import { HandlesProperties, ScaleHandles, TransformHandlesSpace } from './index.js'
import { HandleOptions } from '../store.js'
import { RotateHandles } from './rotate/index.js'

export type TransformHandlesMode = 'rotate' | 'scale' | 'translate'

const xRotationOffset = new Euler()
const yRotationOffset = new Euler(0, 0, Math.PI / 2)
const zRotationOffset = new Euler(0, -Math.PI / 2, 0)

export class TransformHandles extends Group {
  private readonly xAxisHighlight: HandlesAxisHighlight
  private readonly yAxisHighlight: HandlesAxisHighlight
  private readonly zAxisHighlight: HandlesAxisHighlight

  public handles?: TranslateHandles | RotateHandles | ScaleHandles

  public readonly context: HandlesContext

  constructor(getOptions?: () => HandleOptions<unknown>) {
    super()
    this.context = new HandlesContext(this, getOptions)
    this.xAxisHighlight = new HandlesAxisHighlight(this.context, xRotationOffset)
    this.add(this.xAxisHighlight)
    this.yAxisHighlight = new HandlesAxisHighlight(this.context, yRotationOffset)
    this.add(this.yAxisHighlight)
    this.zAxisHighlight = new HandlesAxisHighlight(this.context, zRotationOffset)
    this.add(this.zAxisHighlight)
  }

  set space(space: TransformHandlesSpace | undefined) {
    this.context.space = space
  }

  get space(): TransformHandlesSpace | undefined {
    return this.context.space
  }

  update(time: number, camera: PerspectiveCamera | OrthographicCamera) {
    this.context.update(time)
    this.xAxisHighlight.update()
    this.yAxisHighlight.update()
    this.zAxisHighlight.update()
    this.handles?.update(camera)
  }

  bind(mode: TransformHandlesMode, options?: HandlesProperties) {
    const unbindXAxisHighlight = this.xAxisHighlight.bind('x')
    const unbindYAxisHighlight = this.yAxisHighlight.bind('y')
    const unbindZAxisHighlight = this.zAxisHighlight.bind('z')

    switch (mode) {
      case 'rotate':
        this.handles = new RotateHandles(this.context)
        break
      case 'scale':
        this.handles = new ScaleHandles(this.context)
        break
      case 'translate':
        this.handles = new TranslateHandles(this.context)
        break
    }

    this.add(this.handles)
    const unbind = this.handles.bind(options)
    return () => {
      if (this.handles != null) {
        this.remove(this.handles)
      }
      this.handles = undefined
      unbind()
      unbindXAxisHighlight()
      unbindYAxisHighlight()
      unbindZAxisHighlight()
    }
  }
}

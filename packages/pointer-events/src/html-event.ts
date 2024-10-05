export type Properties<T> = { [K in keyof T as T[K] extends (...args: Array<any>) => any ? never : K]: T[K] }

export class HtmlEvent<E extends object>
  implements
    Properties<
      Omit<
        globalThis.PointerEvent | globalThis.MouseEvent | globalThis.WheelEvent,
        'target' | 'currentTarget' | 'bubbles' | 'srcElement' | 'type'
      >
    >
{
  NONE = 0 as const
  CAPTURING_PHASE = 1 as const
  AT_TARGET = 2 as const
  BUBBLING_PHASE = 3 as const

  relatedTarget = null

  get altKey(): boolean {
    return this.getFromNative('altKey', false)
  }
  get button(): number {
    return this.getFromNative('button', 0)
  }
  get buttons(): number {
    return this.getFromNative('buttons', 0)
  }
  get clientX(): number {
    return this.getFromNative('clientX', 0)
  }
  get clientY(): number {
    return this.getFromNative('clientY', 0)
  }
  get ctrlKey(): boolean {
    return this.getFromNative('ctrlKey', false)
  }
  get layerX(): number {
    return this.getFromNative('layerX', 0)
  }
  get layerY(): number {
    return this.getFromNative('layerY', 0)
  }
  get metaKey(): boolean {
    return this.getFromNative('metaKey', false)
  }
  get movementX(): number {
    return this.getFromNative('movementX', 0)
  }
  get movementY(): number {
    return this.getFromNative('movementY', 0)
  }
  get offsetX(): number {
    return this.getFromNative('offsetX', 0)
  }
  get offsetY(): number {
    return this.getFromNative('offsetY', 0)
  }
  get pageX(): number {
    return this.getFromNative('pageX', 0)
  }
  get pageY(): number {
    return this.getFromNative('pageY', 0)
  }
  get screenX(): number {
    return this.getFromNative('screenX', 0)
  }
  get screenY(): number {
    return this.getFromNative('screenY', 0)
  }
  get shiftKey(): boolean {
    return this.getFromNative('shiftKey', false)
  }
  get x(): number {
    return this.getFromNative('x', 0)
  }
  get y(): number {
    return this.getFromNative('y', 0)
  }
  get detail(): number {
    return this.getFromNative('detail', 0)
  }
  get view(): Window | null {
    return this.getFromNative('view', null)
  }
  get which(): number {
    return this.getFromNative('which', 0)
  }
  get cancelBubble(): boolean {
    return this.getFromNative('cancelBubble', false)
  }
  get composed(): boolean {
    return this.getFromNative('composed', false)
  }
  get eventPhase(): number {
    return this.getFromNative('eventPhase', 0)
  }
  get isTrusted(): boolean {
    return this.getFromNative('isTrusted', false)
  }
  get returnValue(): boolean {
    return this.getFromNative('returnValue', false)
  }
  get timeStamp(): number {
    return this.getFromNative('timeStamp', 0)
  }
  get cancelable(): boolean {
    return this.getFromNative('cancelable', false)
  }
  get defaultPrevented(): boolean {
    return this.getFromNative('defaultPrevented', false)
  }

  constructor(public readonly nativeEvent: E) {}

  getFromNative<T>(key: string, defaultValue: T): T {
    if (key in this.nativeEvent) {
      return this.nativeEvent[key as keyof E] as T
    }
    console.warn(
      `property "key" is not available on this pointer event because the property is not available on the following native event`,
      this.nativeEvent,
    )
    return defaultValue
  }
}

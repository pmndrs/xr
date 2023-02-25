import { vi } from 'vitest'

export class XRSystemMock extends EventTarget implements XRSystem {
  constructor() {
    super()
    this.ondevicechange = null
    this.onsessiongranted = null
  }
  requestSession = vi.fn<Parameters<XRSystem['requestSession']>, ReturnType<XRSystem['requestSession']>>()
  isSessionSupported = vi.fn<Parameters<XRSystem['isSessionSupported']>, ReturnType<XRSystem['isSessionSupported']>>()
  ondevicechange: XRSystemDeviceChangeEventHandler | null
  addEventListener<K extends keyof XRSystemEventMap>(
    type: K,
    listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions | undefined
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | undefined
  ): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void {
    super.addEventListener(type, listener, options)
  }
  removeEventListener<K extends keyof XRSystemEventMap>(
    type: K,
    listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any,
    options?: boolean | EventListenerOptions | undefined
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions | undefined
  ): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void {
    super.removeEventListener(type, listener, options)
  }
  onsessiongranted: XRSystemSessionGrantedEventHandler | null
  dispatchEvent(event: Event): boolean {
    return super.dispatchEvent(event)
  }
}

import { describe, expect, it, vi } from 'vitest'
import { XRController } from './XRController'
import { WebGLRenderer } from 'three'
import { XRInputSourceMock } from './mocks/XRInputSourceMock'
import { WebGLRendererMock } from './mocks/WebGLRendererMock'

describe('XRController', () => {
  it('should initialize controller correctly', () => {
    const webGLRendererMock = new WebGLRendererMock()
    const xrController = new XRController(0, webGLRendererMock as WebGLRenderer)
    expect(xrController.index).toBe(0)
    expect(xrController.visible).toBe(false)
    expect(xrController.grip.userData).toMatchInlineSnapshot(`
      {
        "name": "grip",
      }
    `)
    expect(xrController.controller.userData).toMatchInlineSnapshot(`
      {
        "name": "controller",
      }
    `)
    expect(xrController.hand.userData).toMatchInlineSnapshot(`
      {
        "name": "hand",
      }
    `)
    expect(xrController.children).toContain(xrController.controller)
    expect(xrController.children).toContain(xrController.grip)
    expect(xrController.children).toContain(xrController.hand)
  })

  it('should initialize xr spaces with correct index from three', () => {
    const webGLRendererMock = new WebGLRendererMock()
    const xrManagerMock = webGLRendererMock.xr
    new XRController(1, webGLRendererMock as WebGLRenderer)
    expect(xrManagerMock.getController).toBeCalledWith(1)
    expect(xrManagerMock.getControllerGrip).toBeCalledWith(1)
    expect(xrManagerMock.getHand).toBeCalledWith(1)
  })

  it('should update itself and redispatch event when connected event is dispatched on target ray space', () => {
    const webGLRendererMock = new WebGLRendererMock()
    const xrControler = new XRController(1, webGLRendererMock as WebGLRenderer)
    const xrInputSourceMock = new XRInputSourceMock()
    const dispatchEventSpy = vi.spyOn(xrControler, 'dispatchEvent')

    const connectedEvent = { type: 'connected', data: xrInputSourceMock }
    xrControler.controller.dispatchEvent(connectedEvent)

    expect(xrControler.inputSource).toBe(xrInputSourceMock)
    expect(xrControler.visible).toBe(true)
    expect(dispatchEventSpy).toBeCalledWith(connectedEvent)
  })

  it('should update itself and redispatch event when disconnected event is dispatched on target ray space', () => {
    const webGLRendererMock = new WebGLRendererMock()
    const xrControler = new XRController(1, webGLRendererMock as WebGLRenderer)
    const xrInputSourceMock = new XRInputSourceMock()
    const dispatchEventSpy = vi.spyOn(xrControler, 'dispatchEvent')

    const connectedEvent = { type: 'connected', data: xrInputSourceMock }
    xrControler.controller.dispatchEvent(connectedEvent)

    const disconnectedEvent = { type: 'disconnected', data: xrInputSourceMock }
    xrControler.controller.dispatchEvent(disconnectedEvent)

    expect(xrControler.inputSource).toBe(null)
    expect(xrControler.visible).toBe(false)
    expect(dispatchEventSpy).toBeCalledWith(disconnectedEvent)
  })

  it('should not react after dispose when connected event is dispatched on target ray space', () => {
    const webGLRendererMock = new WebGLRendererMock()
    const xrControler = new XRController(1, webGLRendererMock as WebGLRenderer)
    const xrInputSourceMock = new XRInputSourceMock()
    const dispatchEventSpy = vi.spyOn(xrControler, 'dispatchEvent')

    xrControler.dispose()
    const connectedEvent = { type: 'connected', data: xrInputSourceMock }
    xrControler.controller.dispatchEvent(connectedEvent)

    expect(xrControler.inputSource).toBe(null)
    expect(xrControler.visible).toBe(false)
    expect(dispatchEventSpy).not.toBeCalled()
  })
})

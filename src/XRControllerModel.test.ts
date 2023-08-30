import { describe, it, expect, vi } from 'vitest'
import { XRControllerModel } from './XRControllerModel'
import { BoxBufferGeometry, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'
import { MotionControllerMock } from './mocks/MotionControllerMock'

describe('XRControllerModel', () => {
  it('should correctly set MotionControler when connectMotionController is called', () => {
    const xrControllerModel = new XRControllerModel()
    const motionControllerMock = new MotionControllerMock()
    const dispatchEventSpy = vi.spyOn(xrControllerModel, 'dispatchEvent')

    xrControllerModel.connectMotionController(motionControllerMock)

    expect(xrControllerModel.motionController).toBe(motionControllerMock)
    expect(dispatchEventSpy).toBeCalledWith({
      type: 'motionconnected',
      data: motionControllerMock
    })
  })

  it('should set and connect scene when connectModel is called', () => {
    const xrControllerModel = new XRControllerModel()
    const motionControllerMock = new MotionControllerMock()
    const sceneMock = new Object3D()
    const dispatchEventSpy = vi.spyOn(xrControllerModel, 'dispatchEvent')

    xrControllerModel.connectMotionController(motionControllerMock)
    xrControllerModel.connectModel(sceneMock)

    expect(xrControllerModel.motionController).toBe(motionControllerMock)
    expect(dispatchEventSpy).toBeCalledWith({
      type: 'modelconnected',
      data: sceneMock
    })
    expect(xrControllerModel.children).toContain(sceneMock)
  })

  it('should update motioncontroller from gamepad on updateMatrixWorld', () => {
    const xrControllerModel = new XRControllerModel()
    const motionControllerMock = new MotionControllerMock()

    xrControllerModel.connectMotionController(motionControllerMock)
    xrControllerModel.updateMatrixWorld(false)

    expect(xrControllerModel.motionController?.updateFromGamepad).toBeCalled()
  })

  describe('envMap', () => {
    it('should set and apply environment map when setEnvironmentMap is called after scene is loaded', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const mesh = new Mesh(new BoxBufferGeometry(), new MeshStandardMaterial())
      sceneMock.add(mesh)
      const materialNeedsUpdateSpy = vi.spyOn(mesh.material, 'needsUpdate', 'set')
      const envMapMock = new Texture()

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.connectModel(sceneMock)
      xrControllerModel.setEnvironmentMap(envMapMock, 0.5)

      expect(xrControllerModel.envMap).toBe(envMapMock)
      expect(xrControllerModel.envMapIntensity).toBe(0.5)

      expect(mesh.material.envMap).toBe(envMapMock)
      expect(mesh.material.envMapIntensity).toBe(0.5)
      expect(materialNeedsUpdateSpy).toBeCalledWith(true)
    })

    it('should set and apply environment map when setEnvironmentMap is called after scene is loaded', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const mesh = new Mesh(new BoxBufferGeometry(), new MeshStandardMaterial())
      sceneMock.add(mesh)
      const materialNeedsUpdateSpy = vi.spyOn(mesh.material, 'needsUpdate', 'set')
      const envMapMock = new Texture()

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.connectModel(sceneMock)
      xrControllerModel.setEnvironmentMap(envMapMock)

      expect(xrControllerModel.envMap).toBe(envMapMock)
      expect(xrControllerModel.envMapIntensity).toBe(1)

      expect(mesh.material.envMap).toBe(envMapMock)
      expect(mesh.material.envMapIntensity).toBe(1)
      expect(materialNeedsUpdateSpy).toBeCalledWith(true)
    })

    it('should set and apply environment map to an array material when setEnvironment map is called', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const material1 = new MeshStandardMaterial()
      const material2 = new MeshStandardMaterial()
      const mesh = new Mesh(new BoxBufferGeometry(), [material1, material2])
      sceneMock.add(mesh)
      const material1NeedsUpdateSpy = vi.spyOn(material1, 'needsUpdate', 'set')
      const material2NeedsUpdateSpy = vi.spyOn(material2, 'needsUpdate', 'set')
      const envMapMock = new Texture()

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.connectModel(sceneMock)
      xrControllerModel.setEnvironmentMap(envMapMock, 0.5)

      expect(xrControllerModel.envMap).toBe(envMapMock)
      expect(xrControllerModel.envMapIntensity).toBe(0.5)

      expect(material1.envMap).toBe(envMapMock)
      expect(material1.envMapIntensity).toBe(0.5)
      expect(material1NeedsUpdateSpy).toBeCalledWith(true)

      expect(material2.envMap).toBe(envMapMock)
      expect(material2.envMapIntensity).toBe(0.5)
      expect(material2NeedsUpdateSpy).toBeCalledWith(true)
    })

    it('should set and apply environment map when setEnvironment map is called before scene is loaded', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const mesh = new Mesh(new BoxBufferGeometry(), new MeshStandardMaterial())
      sceneMock.add(mesh)
      const materialNeedsUpdateSpy = vi.spyOn(mesh.material, 'needsUpdate', 'set')
      const envMapMock = new Texture()

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.setEnvironmentMap(envMapMock, 0.5)
      xrControllerModel.connectModel(sceneMock)

      expect(xrControllerModel.envMap).toBe(envMapMock)
      expect(xrControllerModel.envMapIntensity).toBe(0.5)

      expect(mesh.material.envMap).toBe(envMapMock)
      expect(mesh.material.envMapIntensity).toBe(0.5)
      expect(materialNeedsUpdateSpy).toBeCalledWith(true)
    })

    it('should set environment map intensity when setEnvironmentMapIntensity is called before scene is loaded', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const mesh = new Mesh(new BoxBufferGeometry(), new MeshStandardMaterial())
      sceneMock.add(mesh)
      const materialNeedsUpdateSpy = vi.spyOn(mesh.material, 'needsUpdate', 'set')

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.setEnvironmentMapIntensity(0.5)
      xrControllerModel.connectModel(sceneMock)

      expect(xrControllerModel.envMap).toBe(null)
      expect(xrControllerModel.envMapIntensity).toBe(0.5)

      expect(mesh.material.envMap).toBe(null)
      expect(mesh.material.envMapIntensity).toBe(0.5)
      expect(materialNeedsUpdateSpy).toBeCalledWith(true)
    })

    it('should remove environment map when setEnvironmentMap is called with null', () => {
      const xrControllerModel = new XRControllerModel()
      const motionControllerMock = new MotionControllerMock()
      const sceneMock = new Object3D()
      const mesh = new Mesh(new BoxBufferGeometry(), new MeshStandardMaterial())
      sceneMock.add(mesh)
      const materialNeedsUpdateSpy = vi.spyOn(mesh.material, 'needsUpdate', 'set')
      const envMapMock = new Texture()

      xrControllerModel.connectMotionController(motionControllerMock)
      xrControllerModel.connectModel(sceneMock)
      xrControllerModel.setEnvironmentMap(envMapMock)
      expect.soft(xrControllerModel.envMap).toBe(envMapMock)

      xrControllerModel.setEnvironmentMap(null)

      expect(xrControllerModel.envMap).toBe(null)
      expect(mesh.material.envMap).toBe(null)
      expect(materialNeedsUpdateSpy).toBeCalledWith(true)
    })
  })
})

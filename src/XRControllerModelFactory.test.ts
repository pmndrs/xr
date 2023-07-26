import { XRControllerModelFactory } from './XRControllerModelFactory'
import { describe, it, expect, vi, MockedFunction, MockedClass } from 'vitest'
import { XRControllerModelMock } from './mocks/XRControllerModelMock'
import { XRInputSourceMock } from './mocks/XRInputSourceMock'
import { fetchProfile, GLTFLoader, MotionController, Profile } from 'three-stdlib'
import { ProfileMock } from './mocks/ProfileMock'

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles'
const DEFAULT_PROFILE = 'generic-trigger'

const ASSET_PATH = 'https://example.com/asset-path'

vi.mock('three-stdlib')

describe('XRControllerModelFactory', () => {
  it('should warn if asset path from fetchProfile is not defined', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {})
    const xrControllerModelMock = new XRControllerModelMock()
    const xrInputSourceMock = new XRInputSourceMock()
    const modelFactory = new XRControllerModelFactory()
    ;(fetchProfile as MockedFunction<typeof fetchProfile>).mockResolvedValue({ profile: new ProfileMock(), assetPath: undefined })

    await modelFactory.initializeControllerModel(xrControllerModelMock, xrInputSourceMock)

    expect(warnSpy).toBeCalled()
  })

  it('should not do anything if gamepad is missing', async () => {
    const xrControllerModelMock = new XRControllerModelMock()
    const xrInputSourceMock = new XRInputSourceMock()
    xrInputSourceMock.gamepad = undefined
    const modelFactory = new XRControllerModelFactory()
    ;(fetchProfile as MockedFunction<typeof fetchProfile>).mockResolvedValue({ profile: new ProfileMock(), assetPath: ASSET_PATH })

    await modelFactory.initializeControllerModel(xrControllerModelMock, xrInputSourceMock)

    expect(fetchProfile).not.toBeCalled()
  })

  it('should not do anything if target ray mode is not tracked-pointer', async () => {
    const xrControllerModelMock = new XRControllerModelMock()
    const xrInputSourceMock = new XRInputSourceMock({ targetRayMode: 'gaze' })
    const modelFactory = new XRControllerModelFactory()
    ;(fetchProfile as MockedFunction<typeof fetchProfile>).mockResolvedValue({ profile: new ProfileMock(), assetPath: ASSET_PATH })

    await modelFactory.initializeControllerModel(xrControllerModelMock, xrInputSourceMock)

    expect(fetchProfile).not.toBeCalled()
  })

  it('should initialize controller model properly', async () => {
    const xrControllerModelMock = new XRControllerModelMock()
    const xrInputSourceMock = new XRInputSourceMock()
    const modelFactory = new XRControllerModelFactory()
    ;(fetchProfile as MockedFunction<typeof fetchProfile>).mockResolvedValue({ profile: new ProfileMock(), assetPath: ASSET_PATH })

    await modelFactory.initializeControllerModel(xrControllerModelMock, xrInputSourceMock)

    expect(fetchProfile).toBeCalledWith(xrInputSourceMock, DEFAULT_PROFILES_PATH, DEFAULT_PROFILE)
    const motionContoller = (
      MotionController as unknown as MockedClass<{
        new (xrInputSource: XRInputSource, profile: Profile, assetUrl: string): MotionController
      }>
    ).mock.instances[0]
    const gltLoaderMock = GLTFLoader as MockedClass<{ new (): GLTFLoader }>
    const gltfLoader = gltLoaderMock.mock.instances[0]
    expect(xrControllerModelMock.connectMotionController).toBeCalledWith(motionContoller)
    expect(gltfLoader.setPath).toBeCalledWith('')
    expect(gltfLoader.load).toBeCalled()
  })
})

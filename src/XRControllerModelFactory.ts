import { Object3D } from 'three'
import { fetchProfile, GLTFLoader, MotionController } from 'three-stdlib'
import { XRControllerModel } from './XRControllerModel'

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles'
const DEFAULT_PROFILE = 'generic-trigger'

export class XRControllerModelFactory {
  gltfLoader: GLTFLoader
  path: string
  private _assetCache: Record<string, { scene: Object3D } | undefined>

  constructor(gltfLoader: GLTFLoader | null = null, path = DEFAULT_PROFILES_PATH) {
    this.gltfLoader = gltfLoader ?? new GLTFLoader()
    this.path = path
    this._assetCache = {}
  }

   initializeControllerModel(controllerModel: XRControllerModel, xrInputSource: XRInputSource): Promise<void> {
    // TODO check gamepad in other condition
    if (xrInputSource.targetRayMode !== 'tracked-pointer' || !xrInputSource.gamepad) {
      return Promise.resolve()
    }

    return fetchProfile(xrInputSource, this.path, DEFAULT_PROFILE)
      .then(({ profile, assetPath }) => {
        if (!assetPath) {
          throw new Error('no asset path')
        }

        const motionController = new MotionController(xrInputSource, profile, assetPath)
        controllerModel.connectMotionController(motionController)

        const assetUrl = motionController.assetUrl

        const cachedAsset = this._assetCache[assetUrl]
        if (cachedAsset) {
          const scene = cachedAsset.scene.clone()

          controllerModel.connectModel(scene)
        } else {
          if (!this.gltfLoader) {
            throw new Error('GLTFLoader not set.')
          }

          this.gltfLoader.setPath('')
          this.gltfLoader.load(
            assetUrl,
            (asset: { scene: Object3D }) => {
              if (!controllerModel.motionController) {
                console.warn('motionController gone while gltf load, bailing...')
                return
              }

              this._assetCache[assetUrl] = asset
              const scene = asset.scene.clone()
              controllerModel.connectModel(scene)
            },
            undefined,
            () => {
              throw new Error(`Asset ${assetUrl} missing or malformed.`)
            }
          )
        }
      })
      .catch((err) => {
        console.warn(err)
      })
  }
}

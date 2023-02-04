import { Mesh, Object3D, SphereGeometry, MeshBasicMaterial } from 'three'
import type { Texture } from 'three'
import { fetchProfile, GLTFLoader, MotionController, MotionControllerConstants } from 'three-stdlib'

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles'
const DEFAULT_PROFILE = 'generic-trigger'

const applyEnvironmentMap = (envMap: Texture, obj: Object3D): void => {
  obj.traverse((child) => {
    if (child instanceof Mesh && 'envMap' in child.material) {
      child.material.envMap = envMap
      child.material.needsUpdate = true
    }
  })
}

export class XRControllerModel extends Object3D {
  envMap: Texture | null
  motionController: MotionController | null
  scene: Object3D | null

  constructor() {
    super()

    this.motionController = null
    this.envMap = null
    this.scene = null
  }

  setEnvironmentMap(envMap: Texture): XRControllerModel {
    if (this.envMap == envMap) {
      return this
    }

    this.envMap = envMap
    applyEnvironmentMap(this.envMap, this)

    return this
  }

  connectModel(scene: Object3D): void {
    if (!this.motionController) {
      console.warn('scene tried to add, but no motion controller')
      return
    }

    this.scene = scene
    addAssetSceneToControllerModel(this, scene)
    this.dispatchEvent({
      type: 'modelconnected',
      data: scene
    })
  }

  connectMotionController(motionController: MotionController): void {
    this.motionController = motionController
    this.dispatchEvent({
      type: 'motionconnected',
      data: motionController
    })
  }

  /**
   * Polls data from the XRInputSource and updates the model's components to match
   * the real world data
   */
  updateMatrixWorld(force: boolean): void {
    super.updateMatrixWorld(force)

    if (!this.motionController) return

    // Cause the MotionController to poll the Gamepad for data
    this.motionController.updateFromGamepad()

    // Update the 3D model to reflect the button, thumbstick, and touchpad state
    Object.values(this.motionController.components).forEach((component) => {
      // Update node data based on the visual responses' current states
      Object.values(component.visualResponses).forEach((visualResponse) => {
        const { valueNode, minNode, maxNode, value, valueNodeProperty } = visualResponse

        // Skip if the visual response node is not found. No error is needed,
        // because it will have been reported at load time.
        if (!valueNode) return

        // Calculate the new properties based on the weight supplied
        if (valueNodeProperty === MotionControllerConstants.VisualResponseProperty.VISIBILITY && typeof value === 'boolean') {
          valueNode.visible = value
        } else if (
          valueNodeProperty === MotionControllerConstants.VisualResponseProperty.TRANSFORM &&
          minNode &&
          maxNode &&
          typeof value === 'number'
        ) {
          valueNode.quaternion.slerpQuaternions(minNode.quaternion, maxNode.quaternion, value)

          valueNode.position.lerpVectors(minNode.position, maxNode.position, value)
        }
      })
    })
  }

  disconnect(): void {
    this.dispatchEvent({
      type: 'motiondisconnected',
      data: this.motionController
    })
    this.dispatchEvent({
      type: 'modeldisconnected',
      data: this.scene
    })
    this.motionController = null
    if (this.scene) {
      this.remove(this.scene)
    }
    this.scene = null
  }

  dispose(): void {
    this.disconnect()
  }
}

/**
 * Walks the model's tree to find the nodes needed to animate the components and
 * saves them to the motionContoller components for use in the frame loop. When
 * touchpads are found, attaches a touch dot to them.
 */
function findNodes(motionController: MotionController, scene: Object3D): void {
  // Loop through the components and find the nodes needed for each components' visual responses
  Object.values(motionController.components).forEach((component) => {
    const { type, touchPointNodeName, visualResponses } = component

    if (type === MotionControllerConstants.ComponentType.TOUCHPAD && touchPointNodeName) {
      component.touchPointNode = scene.getObjectByName(touchPointNodeName)
      if (component.touchPointNode) {
        // Attach a touch dot to the touchpad.
        const sphereGeometry = new SphereGeometry(0.001)
        const material = new MeshBasicMaterial({ color: 0x0000ff })
        const sphere = new Mesh(sphereGeometry, material)
        component.touchPointNode.add(sphere)
      } else {
        console.warn(`Could not find touch dot, ${component.touchPointNodeName}, in touchpad component ${component.id}`)
      }
    }

    // Loop through all the visual responses to be applied to this component
    Object.values(visualResponses).forEach((visualResponse) => {
      const { valueNodeName, minNodeName, maxNodeName, valueNodeProperty } = visualResponse

      // If animating a transform, find the two nodes to be interpolated between.
      if (valueNodeProperty === MotionControllerConstants.VisualResponseProperty.TRANSFORM && minNodeName && maxNodeName) {
        visualResponse.minNode = scene.getObjectByName(minNodeName)
        visualResponse.maxNode = scene.getObjectByName(maxNodeName)

        // If the extents cannot be found, skip this animation
        if (!visualResponse.minNode) {
          console.warn(`Could not find ${minNodeName} in the model`)
          return
        }

        if (!visualResponse.maxNode) {
          console.warn(`Could not find ${maxNodeName} in the model`)
          return
        }
      }

      // If the target node cannot be found, skip this animation
      visualResponse.valueNode = scene.getObjectByName(valueNodeName)
      if (!visualResponse.valueNode) {
        console.warn(`Could not find ${valueNodeName} in the model`)
      }
    })
  })
}

function addAssetSceneToControllerModel(controllerModel: XRControllerModel, scene: Object3D): void {
  // Find the nodes needed for animation and cache them on the motionController.
  findNodes(controllerModel.motionController!, scene)

  // Apply any environment map that the mesh already has set.
  if (controllerModel.envMap) {
    applyEnvironmentMap(controllerModel.envMap, scene)
  }

  // Add the glTF scene to the controllerModel.
  controllerModel.add(scene)
}

export class XRControllerModelFactory {
  gltfLoader: GLTFLoader
  path: string
  private _assetCache: Record<string, { scene: Object3D } | undefined>
  constructor(gltfLoader: GLTFLoader | null = null, path = DEFAULT_PROFILES_PATH) {
    this.gltfLoader = gltfLoader ?? new GLTFLoader()
    this.path = path
    this._assetCache = {}
  }

  initializeControllerModel(controllerModel: XRControllerModel, event: any): void {
    const xrInputSource = event.data

    if (xrInputSource.targetRayMode !== 'tracked-pointer' || !xrInputSource.gamepad) return

    fetchProfile(xrInputSource, this.path, DEFAULT_PROFILE)
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

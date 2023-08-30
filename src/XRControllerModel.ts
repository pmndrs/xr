import {
  Group,
  Texture,
  Object3D,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Material
} from 'three'
import { MotionController, MotionControllerConstants } from 'three-stdlib'

type MaterialsWithEnvMap = MeshBasicMaterial | MeshStandardMaterial | MeshPhongMaterial | MeshLambertMaterial

const isEnvMapApplicable = (material: Material): material is MaterialsWithEnvMap => 'envMap' in material

const updateEnvMap = (material: MaterialsWithEnvMap, envMap: Texture | null) => {
  material.envMap = envMap
  material.needsUpdate = true
}

const applyEnvironmentMap = (envMap: Texture | null, obj: Object3D): void => {
  if (obj instanceof Mesh) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => (isEnvMapApplicable(m) ? updateEnvMap(m, envMap) : undefined))
    } else if (isEnvMapApplicable(obj.material)) {
      updateEnvMap(obj.material, envMap)
    }
  }
}

type MaterialsWithEnvMapIntensity = Material & { envMapIntensity: any }

const isEnvMapIntensityApplicable = (material: Material): material is MaterialsWithEnvMapIntensity => 'envMapIntensity' in material

const updateEnvMapIntensity = (material: MaterialsWithEnvMapIntensity, envMapIntensity: number) => {
  material.envMapIntensity = envMapIntensity
  material.needsUpdate = true
}

const applyEnvironmentMapIntensity = (envMapIntensity: number, obj: Object3D): void => {
  if (obj instanceof Mesh) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => (isEnvMapIntensityApplicable(m) ? updateEnvMapIntensity(m, envMapIntensity) : undefined))
    } else if (isEnvMapIntensityApplicable(obj.material)) {
      updateEnvMapIntensity(obj.material, envMapIntensity)
    }
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
  if (controllerModel.envMap || controllerModel.envMapIntensity != null) {
    scene.traverse((c) => {
      if (controllerModel.envMap) applyEnvironmentMap(controllerModel.envMap, c)
      if (controllerModel.envMapIntensity != null) applyEnvironmentMapIntensity(controllerModel.envMapIntensity, c)
    })
  }

  // Add the glTF scene to the controllerModel.
  controllerModel.add(scene)
}

export class XRControllerModel extends Group {
  envMap: Texture | null
  envMapIntensity: number
  motionController: MotionController | null
  scene: Object3D | null

  constructor() {
    super()

    this.motionController = null
    this.envMap = null
    this.envMapIntensity = 1
    this.scene = null
  }

  setEnvironmentMap(envMap: Texture | null, envMapIntensity = 1): XRControllerModel {
    if (this.envMap === envMap && this.envMapIntensity === envMapIntensity) {
      return this
    }

    this.envMap = envMap
    this.envMapIntensity = envMapIntensity
    this.scene?.traverse((c) => {
      applyEnvironmentMap(envMap, c)
      applyEnvironmentMapIntensity(envMapIntensity, c)
    })

    return this
  }

  setEnvironmentMapIntensity(envMapIntensity: number): XRControllerModel {
    if (this.envMapIntensity === envMapIntensity) {
      return this
    }

    this.envMapIntensity = envMapIntensity
    this.scene?.traverse((c) => applyEnvironmentMapIntensity(envMapIntensity, c))

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

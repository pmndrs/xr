import {
  Color,
  Material,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from 'three'
import { GLTF, GLTFLoader, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HumanoidRig } from '../rig/humanoid-rig.js'
import { SpringCollider, SpringJoint } from '../rig/springs.js'

type TextureInfo = { index: number }

type MToonExtension = {
  shadeColorFactor?: [number, number, number]
  shadeMultiplyTexture?: TextureInfo
  shadingShiftFactor?: number
  shadingToonyFactor?: number
  transparentWithZWrite?: boolean
  renderQueueOffsetNumber?: number
}

type SpringBoneExtension = {
  colliders?: Array<{
    node: number
    shape: {
      sphere?: { offset?: [number, number, number]; radius?: number }
      capsule?: { offset?: [number, number, number]; radius?: number; tail?: [number, number, number] }
    }
  }>
  colliderGroups?: Array<{ colliders: Array<number> }>
  springs?: Array<{
    joints: Array<{
      node: number
      hitRadius?: number
      stiffness?: number
      gravityPower?: number
      gravityDir?: [number, number, number]
      dragForce?: number
    }>
    colliderGroups?: Array<number>
  }>
}

type VRMExtension = { humanoid: { humanBones: Record<string, { node: number }> } }

export const vrmLoader = new GLTFLoader().register((parser) => new VRMLoaderPlugin(parser))

export function getVRM(gltf: GLTF): HumanoidRig {
  return gltf.userData.vrm as HumanoidRig
}

class VRMLoaderPlugin implements GLTFLoaderPlugin {
  readonly name = 'VRMC_vrm'

  constructor(private readonly parser: GLTFParser) {}

  async afterRoot(gltf: GLTF): Promise<void> {
    const extensions = this.parser.json.extensions ?? {}
    const vrm = extensions.VRMC_vrm as VRMExtension | undefined
    if (vrm == null) {
      throw new Error('only VRM 1.0 files are supported')
    }
    await replaceMToonMaterials(this.parser, gltf.scene)
    const bones = new Map<string, Object3D>()
    for (const [name, { node }] of Object.entries(vrm.humanoid.humanBones)) {
      bones.set(name, await this.parser.getDependency('node', node))
    }
    const springs = await loadSpringBones(this.parser, extensions.VRMC_springBone as SpringBoneExtension | undefined)
    gltf.userData.vrm = new HumanoidRig(gltf.scene, bones, springs)
  }
}

const vertexShader = `
#include <common>
#include <skinning_pars_vertex>
uniform mat3 mapTransform;
varying vec2 vMapUv;
varying vec3 vViewNormal;
void main() {
  vMapUv = (mapTransform * vec3(uv, 1.0)).xy;
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  vViewNormal = normalize(transformedNormal);
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
}
`

const fragmentShader = `
#include <common>
#include <lights_pars_begin>
uniform vec3 litFactor;
uniform float opacity;
uniform sampler2D map;
uniform bool hasMap;
uniform vec3 shadeFactor;
uniform sampler2D shadeMap;
uniform bool hasShadeMap;
uniform float shadingShift;
uniform float shadingToony;
uniform float alphaCutoff;
varying vec2 vMapUv;
varying vec3 vViewNormal;
void main() {
  vec4 base = vec4(litFactor, opacity);
  if (hasMap) base *= texture2D(map, vMapUv);
  if (base.a < alphaCutoff) discard;
  vec3 shade = shadeFactor;
  if (hasShadeMap) shade *= texture2D(shadeMap, vMapUv).rgb;
  vec3 normal = normalize(vViewNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 color = base.rgb * ambientLightColor * RECIPROCAL_PI;
  #if NUM_DIR_LIGHTS > 0
  for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
    float shading = dot(normal, directionalLights[i].direction) + shadingShift;
    float edge0 = -1.0 + shadingToony;
    float edge1 = max(1.0 - shadingToony, edge0 + 1e-5);
    shading = clamp((shading - edge0) / (edge1 - edge0), 0.0, 1.0);
    color += mix(shade, base.rgb, shading) * directionalLights[i].color * RECIPROCAL_PI;
  }
  #endif
  gl_FragColor = vec4(color, base.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

async function replaceMToonMaterials(parser: GLTFParser, root: Object3D): Promise<void> {
  const slots: Array<{ mesh: Mesh; slot: number | undefined; material: Material }> = []
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }
    if (Array.isArray(object.material)) {
      object.material.forEach((material: Material, slot: number) => slots.push({ mesh: object, slot, material }))
    } else {
      slots.push({ mesh: object, slot: undefined, material: object.material })
    }
  })
  const converted = new Map<Material, Promise<{ material: Material; renderOrder: number }>>()
  for (const { mesh, slot, material } of slots) {
    const index = parser.associations.get(material)?.materials
    const extension =
      index == null
        ? undefined
        : (parser.json.materials[index]?.extensions?.VRMC_materials_mtoon as MToonExtension | undefined)
    if (extension == null) {
      continue
    }
    let result = converted.get(material)
    if (result == null) {
      result = createMToonMaterial(parser, material as MeshBasicMaterial, extension, index!)
      converted.set(material, result)
    }
    const { material: toon, renderOrder } = await result
    if (slot == null) {
      mesh.material = toon
    } else {
      ;(mesh.material as Array<Material>)[slot] = toon
    }
    mesh.renderOrder = renderOrder
  }
}

async function createMToonMaterial(
  parser: GLTFParser,
  base: MeshBasicMaterial,
  extension: MToonExtension,
  materialIndex: number,
): Promise<{ material: Material; renderOrder: number }> {
  const map = base.map
  map?.updateMatrix()
  const baseTextureIndex = parser.json.materials[materialIndex]?.pbrMetallicRoughness?.baseColorTexture?.index
  let shadeMap: Texture | null = null
  const shadeIndex = extension.shadeMultiplyTexture?.index
  if (shadeIndex != null) {
    if (shadeIndex === baseTextureIndex && map != null) {
      shadeMap = map
    } else {
      shadeMap = ((await parser.getDependency('texture', shadeIndex)) as Texture).clone()
      shadeMap.colorSpace = SRGBColorSpace
      shadeMap.flipY = false
    }
  }
  const material = new ShaderMaterial({
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.lights),
      litFactor: { value: base.color.clone() },
      opacity: { value: base.opacity },
      map: { value: map },
      hasMap: { value: map != null },
      mapTransform: { value: map?.matrix.clone() ?? new Matrix3() },
      shadeFactor: { value: new Color().fromArray(extension.shadeColorFactor ?? [1, 1, 1]) },
      shadeMap: { value: shadeMap },
      hasShadeMap: { value: shadeMap != null },
      shadingShift: { value: extension.shadingShiftFactor ?? 0 },
      shadingToony: { value: extension.shadingToonyFactor ?? 0.9 },
      alphaCutoff: { value: base.alphaTest },
    },
    vertexShader,
    fragmentShader,
    lights: true,
    toneMapped: false,
    transparent: base.transparent,
    side: base.side,
    depthWrite: base.transparent ? extension.transparentWithZWrite === true : true,
  })
  material.name = base.name
  return { material, renderOrder: base.transparent ? (extension.renderQueueOffsetNumber ?? 0) : 0 }
}

async function loadSpringBones(
  parser: GLTFParser,
  extension: SpringBoneExtension | undefined,
): Promise<Array<SpringJoint>> {
  if (extension?.springs == null) {
    return []
  }
  const node = (index: number): Promise<Object3D> => parser.getDependency('node', index)
  const colliders = await Promise.all(
    (extension.colliders ?? []).map(async ({ node: index, shape }) => {
      const sphere = shape.sphere
      const capsule = shape.capsule
      return {
        node: await node(index),
        offset: new Vector3().fromArray(sphere?.offset ?? capsule?.offset ?? [0, 0, 0]),
        radius: sphere?.radius ?? capsule?.radius ?? 0,
        tail: capsule?.tail == null ? undefined : new Vector3().fromArray(capsule.tail),
      } satisfies SpringCollider
    }),
  )
  const groups = (extension.colliderGroups ?? []).map((group) => group.colliders.map((index) => colliders[index]))
  const joints: Array<SpringJoint> = []
  for (const spring of extension.springs) {
    const springColliders = (spring.colliderGroups ?? []).flatMap((index) => groups[index] ?? [])
    for (let i = 0; i < spring.joints.length - 1; i++) {
      const settings = spring.joints[i]
      const head = await node(settings.node)
      const tail = await node(spring.joints[i + 1].node)
      if (tail.parent !== head) {
        continue
      }
      joints.push({
        node: head,
        axis: tail.position.clone().normalize(),
        length: tail.position.length(),
        initialRotation: head.quaternion.clone(),
        hitRadius: settings.hitRadius ?? 0,
        stiffness: settings.stiffness ?? 1,
        gravityPower: settings.gravityPower ?? 0,
        gravityDir: new Vector3().fromArray(settings.gravityDir ?? [0, -1, 0]),
        dragForce: settings.dragForce ?? 0.5,
        colliders: springColliders,
        currentTail: new Vector3(),
        previousTail: new Vector3(),
        initialized: false,
      })
    }
  }
  return joints
}

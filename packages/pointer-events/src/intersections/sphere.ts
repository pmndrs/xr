import {
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  Vector3,
  Sphere,
  Quaternion,
  Intersection as ThreeIntersection,
  Plane,
} from 'three'
import { computeIntersectionWorldPlane, getDominantIntersectionIndex } from './utils.js'
import type { PointerCapture } from '../pointer.js'
import { Intersector } from './intersector.js'
import { Intersection, IntersectionOptions } from '../index.js'

const collisionSphere = new Sphere()
const intersectsHelper: Array<ThreeIntersection> = []

export class SphereIntersector extends Intersector {
  private readonly fromPosition = new Vector3()
  private readonly fromQuaternion = new Quaternion()

  constructor(
    /**
     * @returns the sphere radius
     */
    private readonly prepareTransformation: (
      nativeEvent: unknown,
      fromPosition: Vector3,
      fromQuaternion: Quaternion,
    ) => number | undefined,
    private readonly options: IntersectionOptions,
  ) {
    super()
  }

  public intersectPointerCapture(
    { intersection, object }: PointerCapture,
    nativeEvent: unknown,
  ): Intersection | undefined {
    if (intersection.details.type != 'sphere') {
      return undefined
    }
    if (this.prepareTransformation(nativeEvent, this.fromPosition, this.fromQuaternion) == null) {
      return undefined
    }
    //compute old inputDevicePosition-point offset
    oldInputDevicePointOffset.copy(intersection.point).sub(intersection.pointerPosition)
    //compute oldInputDeviceQuaternion-newInputDeviceQuaternion offset
    inputDeviceQuaternionOffset.copy(intersection.pointerQuaternion).invert().multiply(this.fromQuaternion)
    //apply quaternion offset to old inputDevicePosition-point offset and add to new inputDevicePosition
    const point = oldInputDevicePointOffset.clone().applyQuaternion(inputDeviceQuaternionOffset).add(this.fromPosition)

    computeIntersectionWorldPlane(planeHelper, intersection, object)

    const pointOnFace = planeHelper.projectPoint(this.fromPosition, new Vector3())

    return {
      details: {
        type: 'sphere',
      },
      distance: intersection.distance,
      pointerPosition: this.fromPosition.clone(),
      pointerQuaternion: this.fromQuaternion.clone(),
      object,
      point,
      pointOnFace,
      face: intersection.face,
      localPoint: intersection.localPoint,
    }
  }

  protected prepareIntersection(nativeEvent: unknown): boolean {
    const radius = this.prepareTransformation(nativeEvent, this.fromPosition, this.fromQuaternion)
    if (radius == null) {
      return false
    }
    collisionSphere.center.copy(this.fromPosition)
    collisionSphere.radius = radius
    return true
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    intersectSphereWithObject(collisionSphere, object, intersectsHelper)
    const index = getDominantIntersectionIndex(
      this.intersection,
      this.pointerEventsOrder,
      intersectsHelper,
      objectPointerEventsOrder,
      this.options,
    )
    if (index != null) {
      this.intersection = intersectsHelper[index]
      this.pointerEventsOrder = objectPointerEventsOrder
    }
    intersectsHelper.length = 0
  }

  public finalizeIntersection(): Intersection | undefined {
    if (this.intersection == null) {
      return undefined
    }

    return Object.assign(this.intersection, {
      details: {
        type: 'sphere' as const,
      },
      pointOnFace: this.intersection.point,
      pointerPosition: this.fromPosition.clone(),
      pointerQuaternion: this.fromQuaternion.clone(),
      localPoint: this.intersection.point
        .clone()
        .applyMatrix4(invertedMatrixHelper.copy(this.intersection.object.matrixWorld).invert()),
    })
  }
}

const matrixHelper = new Matrix4()

function isSpherecastable(obj: Object3D): obj is Object3D & {
  spherecast(sphere: Sphere, intersects: Array<ThreeIntersection>): void
} {
  return 'spherecast' in obj
}

function intersectSphereWithObject(pointerSphere: Sphere, object: Object3D, target: Array<ThreeIntersection>): void {
  object.updateWorldMatrix(true, false)
  if (isSpherecastable(object)) {
    object.spherecast(pointerSphere, target)
    return
  }
  if (object instanceof InstancedMesh) {
    if (object.geometry.boundingSphere == null) {
      object.geometry.computeBoundingSphere()
    }
    if (object.geometry.boundingBox == null) {
      object.geometry.computeBoundingBox()
    }
    for (let i = 0; i < object.count; i++) {
      object.getMatrixAt(i, matrixHelper)
      matrixHelper.premultiply(object.matrixWorld)
      if (!isSphereIntersectingMesh(pointerSphere, object, matrixHelper)) {
        continue
      }
      const intersection = intersectSphereMesh(pointerSphere, object, matrixHelper, i)
      if (intersection == null) {
        continue
      }
      target.push(intersection)
    }
  }

  if (!(object instanceof Mesh)) {
    return
  }
  if (!isSphereIntersectingMesh(pointerSphere, object, object.matrixWorld)) {
    return
  }

  invertedMatrixHelper.copy(object.matrixWorld).invert()

  const intersection = intersectSphereMesh(pointerSphere, object, object.matrixWorld)
  if (intersection == null) {
    return
  }

  target.push(intersection)
}

const oldInputDevicePointOffset = new Vector3()
const inputDeviceQuaternionOffset = new Quaternion()
const planeHelper = new Plane()

const helperSphere = new Sphere()

function isSphereIntersectingMesh(pointerSphere: Sphere, { geometry }: Mesh, meshMatrixWorld: Matrix4): boolean {
  if (geometry.boundingSphere == null) {
    geometry.computeBoundingSphere()
  }
  helperSphere.copy(geometry.boundingSphere!).applyMatrix4(meshMatrixWorld)
  return helperSphere.center.distanceToSquared(pointerSphere.center) < (pointerSphere.radius + helperSphere.radius) ** 2
}

const vectorHelper = new Vector3()

const boxSizeHelper = new Vector3()
const boxCenterHelper = new Vector3()

const vec0_0001 = new Vector3(0.0001, 0.0001, 0.0001)

const invertedMatrixHelper = new Matrix4()

function intersectSphereMesh(
  pointerSphere: Sphere,
  mesh: Mesh,
  meshMatrixWorld: Matrix4,
  instanceId?: number,
): ThreeIntersection | undefined {
  invertedMatrixHelper.copy(meshMatrixWorld).invert()

  helperSphere.copy(pointerSphere).applyMatrix4(invertedMatrixHelper)

  const { geometry } = mesh
  if (geometry.boundingBox == null) {
    geometry.computeBoundingBox()
  }
  geometry.boundingBox!.getSize(boxSizeHelper)
  geometry.boundingBox!.getCenter(boxCenterHelper)
  geometry.boundingBox!.clampPoint(helperSphere.center, vectorHelper)

  vectorHelper.applyMatrix4(meshMatrixWorld) //world coordinates
  const distanceToSphereCenterSquared = vectorHelper.distanceToSquared(pointerSphere.center)
  if (distanceToSphereCenterSquared > pointerSphere.radius * pointerSphere.radius) {
    return undefined
  }

  boxSizeHelper.max(vec0_0001)
  const normal = helperSphere.center.clone().sub(boxCenterHelper)

  normal.divide(boxSizeHelper)
  maximizeAxisVector(normal)

  const point = vectorHelper.clone()

  return {
    distance: Math.sqrt(distanceToSphereCenterSquared),
    face: {
      a: 0,
      b: 0,
      c: 0,
      materialIndex: 0,
      normal,
    },
    normal,
    point,
    instanceId,
    object: mesh,
  }
}

function maximizeAxisVector(vec: Vector3): void {
  const absX = Math.abs(vec.x)
  const absY = Math.abs(vec.y)
  const absZ = Math.abs(vec.z)
  if (absX >= absY && absX >= absZ) {
    //x biggest
    vec.set(vec.x < 0 ? -1 : 1, 0, 0)
    return
  }

  if (absY >= absX && absY >= absZ) {
    //y biggest
    vec.set(0, vec.y < 0 ? -1 : 1, 0)
    return
  }

  //z biggest
  vec.set(0, 0, vec.z < 0 ? -1 : 1)
}

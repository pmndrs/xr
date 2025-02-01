import { ThreeElements, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BufferGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Vector2,
  Vector3,
  WebGLProgramParametersWithUniforms,
} from 'three'

const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()

export function Smoke({
  count,
  speed,
  maxSize,
  minSize,
  spawnRate,
  ...props
}: {
  count: number
  speed: number
  maxSize: number
  minSize: number
  spawnRate: number
} & Omit<ThreeElements['instancedMesh'], 'args'>) {
  const ref = useRef<InstancedMesh<BufferGeometry, MeshBasicMaterial>>(null)
  const maxLength = (count / spawnRate) * speed
  const opacityAttribute = useMemo(() => {
    const result = new InstancedBufferAttribute(new Float32Array(count).fill(1.0), 1, false)
    result.setUsage(DynamicDrawUsage)
    return result
  }, [count])
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    ref.current.geometry.attributes.aOpacity = opacityAttribute
    for (let i = 0; i < count; i++) {
      randomDirection(vectorHelper)
      matrixHelper.setPosition(vectorHelper)
      opacityAttribute.array[i] = go(matrixHelper, (i / count) * maxLength, maxLength, minSize, maxSize)
      ref.current.instanceMatrix.array.set(matrixHelper.elements, i * 16)
    }
    ref.current.instanceMatrix.addUpdateRange(0, count * 16)
    ref.current.instanceMatrix.needsUpdate = true
    opacityAttribute.addUpdateRange(0, count)
    opacityAttribute.needsUpdate = true
  }, [count, maxSize, minSize, speed, maxLength, opacityAttribute])
  useFrame((_, delta) => {
    if (ref.current == null) {
      return
    }
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, matrixHelper)
      opacityAttribute.array[i] = go(matrixHelper, delta * speed, maxLength, minSize, maxSize)
      ref.current.instanceMatrix.array.set(matrixHelper.elements, i * 16)
    }
    ref.current.instanceMatrix.addUpdateRange(0, count * 16)
    ref.current.instanceMatrix.needsUpdate = true
    opacityAttribute.addUpdateRange(0, count)
    opacityAttribute.needsUpdate = true
  })
  return (
    <instancedMesh renderOrder={-1} ref={ref} args={[undefined, undefined, count]} {...props}>
      <meshBasicMaterial
        onBeforeCompile={addOpacity}
        depthWrite={false}
        opacity={0.1}
        transparent
        depthTest={false}
        color={0x222222}
      />
      <sphereGeometry />
    </instancedMesh>
  )
}

const vector2Helper = new Vector2()

function randomDirection(vector: Vector3): Vector3 {
  vector2Helper.set((Math.random() * 2 - 1) * 0.5, (Math.random() * 2 - 1) * 0.5)
  const length = vector2Helper.length()
  vector2Helper.multiplyScalar(Math.min(1, length) / length)
  vector.set(vector2Helper.x, 1, vector2Helper.y).normalize()
  return vector
}

function go(matrix: Matrix4, delta: number, maxLength: number, minSize: number, maxSize: number): number {
  vectorHelper.setFromMatrixPosition(matrix)
  const currentTime = vectorHelper.length()
  const newTime = currentTime + delta
  if (newTime > maxLength) {
    randomDirection(vectorHelper).multiplyScalar(newTime % maxLength)
  } else {
    vectorHelper.multiplyScalar(newTime / currentTime)
  }
  const scale = minSize + (maxSize - minSize) * (newTime / maxLength)
  matrixHelper.makeScale(scale, scale, scale)
  matrixHelper.setPosition(vectorHelper)
  return 1 - newTime / maxLength
}

function addOpacity(parameters: WebGLProgramParametersWithUniforms) {
  parameters.vertexShader = parameters.vertexShader.replace(
    '#include <common>',
    ` #include <common>
        attribute float aOpacity;
        out float alpha;`,
  )

  parameters.vertexShader = parameters.vertexShader.replace(
    '#include <uv_vertex>',
    ` #include <uv_vertex>
        alpha = aOpacity;`,
  )

  parameters.fragmentShader = `in float alpha;\n${parameters.fragmentShader}`

  parameters.fragmentShader = parameters.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
      diffuseColor.a *= alpha;\n`,
  )
}

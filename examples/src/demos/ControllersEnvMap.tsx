import { Canvas, useThree } from '@react-three/fiber'
import { XR, VRButton, Controllers } from '@react-three/xr'
import { PMREMGenerator, Texture } from 'three'
import { RGBELoader } from 'three-stdlib'
import { useEffect, useState } from 'react'
import EnvMap from '../assets/brown_photostudio_04_256.hdr'

function ControllersWithEnvMap() {
  const renderer = useThree(({ gl }) => gl)
  const [envMap, setEnvMap] = useState<Texture>()
  useEffect(() => {
    const foo = async () => {
      const rgbeLoader = new RGBELoader()
      const dataTexture = await rgbeLoader.loadAsync(EnvMap)
      const pmremGenerator = new PMREMGenerator(renderer)
      pmremGenerator.compileEquirectangularShader()
      const rt = pmremGenerator.fromEquirectangular(dataTexture)
      const radianceMap = rt.texture
      setEnvMap(radianceMap)
      pmremGenerator.dispose()
    }
    foo()
  }, [renderer])

  return <Controllers envMap={envMap} envMapIntensity={1} />
}

export default function () {
  return (
    <>
      <VRButton onError={(e) => console.error(e)} />
      <Canvas>
        <XR>
          {/*<ambientLight intensity={0.5} />*/}
          {/*<pointLight position={[5, 5, 5]} />*/}
          <ControllersWithEnvMap />
        </XR>
      </Canvas>
    </>
  )
}

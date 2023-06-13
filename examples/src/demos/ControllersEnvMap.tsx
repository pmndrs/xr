import { Canvas, dispose, useThree } from '@react-three/fiber'
import { XR, VRButton, Controllers, useXR } from '@react-three/xr'
import {
  Texture,
} from 'three'
import { RGBELoader } from 'three-stdlib'
import { useEffect, useRef, useState } from 'react'
import EnvMap from '../assets/brown_photostudio_04_256.hdr'
import {PMREMGenerator} from "./PMREMGenerator";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))


function ControllersWithEnvMap() {
  const renderer = useThree(({ gl }) => gl)
  const isPresenting = useXR(({ isPresenting }) => isPresenting)
  const [envMap, setEnvMap] = useState<Texture>()
  useEffect(() => {
    const foo = async () => {
      if (!isPresenting) return
      // if (isPresenting) return
      await delay(100)
      const rgbeLoader = new RGBELoader()
      /**
       * Чтобы воспроизвести, нажми Enter VR раньше, чем 5 сек
       * Чтобы починилось, нажми позже, когда карта загрузилась
       */
      const dataTexture = await rgbeLoader.loadAsync(EnvMap)
      const pmremGenerator = new PMREMGenerator(renderer)
      pmremGenerator.compileEquirectangularShader()
      const rt = pmremGenerator.fromEquirectangular(dataTexture)
      const radianceMap = rt.texture
      setEnvMap(radianceMap)
      pmremGenerator.dispose()
      console.log('done radianceMap', radianceMap.encoding, rt.isXRRenderTarget)
    }
    foo()
  }, [isPresenting])

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

import {Canvas, dispose, useThree} from '@react-three/fiber'
import {XR, VRButton, Controllers, useXR} from '@react-three/xr'
import { PMREMGenerator, Texture } from 'three'
import { RGBELoader } from 'three-stdlib'
import {useEffect, useRef, useState} from 'react'
import EnvMap from "../assets/brown_photostudio_04_256.hdr";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
function ControllersWithEnvMap() {
  const renderer = useThree(({ gl }) => gl)
  const isPresenting = useXR(({ isPresenting }) => isPresenting)
  const [envMap, setEnvMap] = useState<Texture>()
  const g = useRef<PMREMGenerator>()
  useEffect(() => {
    const pmremGenerator = new PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    g.current = pmremGenerator
  }, [])
  useEffect(() => {
    const foo = async () => {
      const pmremGenerator = g.current!
      if (!isPresenting) {
        return
      }
      // if (isPresenting) return
      await delay(100)
      const rgbeLoader = new RGBELoader()
      /**
       * Чтобы воспроизвести, нажми Enter VR раньше, чем 5 сек
       * Чтобы починилось, нажми позже, когда карта загрузилась
       */
      const dataTexture = await rgbeLoader.loadAsync(EnvMap)
      const radianceMap = pmremGenerator.fromEquirectangular(dataTexture).texture
      setEnvMap(radianceMap)
      pmremGenerator.dispose()
      console.log('done radianceMap')
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

import { Vector3 } from 'three'
import { DemoControllers } from './Controllers.js'
import { Headset } from './Headset.js'
import { Person } from './Person.js'
import { Room } from './Room.js'
import { SelectableComponents } from './SelectableComponents.enum'
import { VirtualBall } from './VirtualBall.js'
import { VirtualPainting } from './VirtualPainting.js'
import { GroundDisk } from './XrOriginRepresentation.js'

const ballPosition = new Vector3(-1, 2, 2)
const xrOriginRepresentationPostition = new Vector3(0, 0.01, 0)

interface SceneProps {
  selectedElement: SelectableComponents
  isPositionedObjectSelected: boolean
  setSelectedElement: (e: SelectableComponents) => void
}

export const Scene = ({ selectedElement, setSelectedElement, isPositionedObjectSelected }: SceneProps) => {
  return (
    <>
      <Room setIsSelected={setSelectedElement} isSelected={selectedElement === SelectableComponents.room} />
      <VirtualPainting
        setIsSelected={setSelectedElement}
        isSelected={selectedElement === SelectableComponents.picture}
      />
      <Person setIsSelected={setSelectedElement} isSelected={selectedElement === SelectableComponents.person} />
      <DemoControllers
        setIsSelected={setSelectedElement}
        isSelected={selectedElement === SelectableComponents.controllers}
      />
      <Headset setIsSelected={setSelectedElement} isSelected={selectedElement === SelectableComponents.headset} />
      <GroundDisk
        setIsSelected={setSelectedElement}
        isSelected={selectedElement === SelectableComponents.origin}
        position={xrOriginRepresentationPostition}
        isPositionedObjectSelected={isPositionedObjectSelected}
      />
      <VirtualBall
        setIsSelected={setSelectedElement}
        isSelected={selectedElement === SelectableComponents.ball}
        position={ballPosition}
      />
    </>
  )
}

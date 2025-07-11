export enum SelectableComponents {
  controllers,
  headset,
  person,
  ball,
  origin,
  room,
  default,
  picture,
}

export type HighlightAndSelectableElement = {
  isHovered?: boolean;
  isSelected?: boolean;
  setIsSelected: (s: SelectableComponents) => void;
};

export namespace SelectableComponents {
  const orderedValues = [
    SelectableComponents.controllers,
    SelectableComponents.headset,
    SelectableComponents.person,
    SelectableComponents.ball,
    SelectableComponents.origin,
    SelectableComponents.room,
    SelectableComponents.default,
    SelectableComponents.picture,
  ];

  const positionedObjects = [
    SelectableComponents.controllers,
    SelectableComponents.headset,
    SelectableComponents.ball,
    SelectableComponents.picture,
  ];

  export function getNextValue(s: SelectableComponents): SelectableComponents {
    const index = orderedValues.indexOf(s);
    return orderedValues[(index + 1) % orderedValues.length];
  }

  export function getPrevValue(s: SelectableComponents): SelectableComponents {
    const index = orderedValues.indexOf(s);
    return orderedValues[
      (index - 1 + orderedValues.length) % orderedValues.length
    ];
  }
  export function isPositionedObjectSelected(s: SelectableComponents): boolean {
    return positionedObjects.some((x) => x === s);
  }
}

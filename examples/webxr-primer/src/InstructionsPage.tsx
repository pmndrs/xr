import { InstructionalContent } from "./InstructionalContent";
import { SelectableComponents } from "./SelectableComponents.enum";

interface InstructionsPageProps {
  selectedElement: SelectableComponents;
  onNextClick: () => void;
  onPrevClick: () => void;
}
export const InstructionsPage = ({
  selectedElement,
  onNextClick,
  onPrevClick
}: InstructionsPageProps) => {
  return (
    <div className="instructions">
      <span className="instructionsText">
        {InstructionalContent[selectedElement]}
      </span>

      <div className="navigation">
        <button onClick={onPrevClick}>{"Previous"}</button>
        <button onClick={onNextClick}>{"Next"}</button>
      </div>
    </div>
  );
};

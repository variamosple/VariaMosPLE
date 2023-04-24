import { Button } from "react-bootstrap";
import { CreateLanguageProps } from "../index.types";
import config from './CreateLanguageButton.json'

export default function CreateLanguageButton({
  handleCreateClick
}: CreateLanguageProps) {
  return (
      <Button variant="primary" onClick={handleCreateClick}>
        {config.buttonLabel}
      </Button>
  );
}

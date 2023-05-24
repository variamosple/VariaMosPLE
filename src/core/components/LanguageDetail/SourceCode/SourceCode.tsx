// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Prism from "prismjs";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-json";
import "prism-themes/themes/prism-vsc-dark-plus.css";
import Editor from "react-simple-code-editor";
import { SourceCodeProps } from "./SourceCode.types";
import { Container } from "react-bootstrap";

export default function SourceCode({ code, dispatcher }: SourceCodeProps) {
  const handleCodeChange = (currentCode) => {
    dispatcher(currentCode);
  };

  return (
    <Container style={{ maxHeight: "800px", overflow: "auto" }}>
      <Editor
        value={code}
        onValueChange={handleCodeChange}
        highlight={(code) => highlight(code, languages.json, "json")}
        padding={10}
        className="editor"
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 18,
          backgroundColor: "#1e1e1e",
          caretColor: "gray",
          color: "gray",
          borderRadius: "10px",
          overflow: "auto"
        }}
      />
    </Container>
  );
}

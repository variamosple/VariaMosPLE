import React, { Component } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface UvlEditorProps {
  projectService: ProjectService;
  model: Model;
}

interface UvlEditorState {
  value: string;
  fileName: string;
  problemCount: number;
}

// ===== NUEVO: Identificador del "owner" para los markers UVL =====
const UVL_MARKER_OWNER = "uvl-linter";

// ===== NUEVO: Validador de indentación / formato UVL =====
// Reglas básicas:
//  - No mezclar tabs y espacios en la indentación de una misma línea.
//  - La indentación debe ser múltiplo de 4 espacios (o tabs equivalentes).
//  - Bajo "features"/"constraints" debe haber indentación.
//  - Brackets balanceados ( ), { }, [ ].
//  - Keywords de grupo (mandatory/optional/or/alternative) deben estar indentados.
function validateUvlText(text: string): Array<{
  line: number;
  column: number;
  endColumn: number;
  message: string;
  severity: "error" | "warning";
}> {
  const problems: Array<{
    line: number;
    column: number;
    endColumn: number;
    message: string;
    severity: "error" | "warning";
  }> = [];

  const lines = text.split(/\r?\n/);
  const groupKeywords = ["mandatory", "optional", "or", "alternative"];
  let inFeatures = false;
  let inConstraints = false;

  const bracketStack: Array<{ ch: string; line: number; col: number }> = [];
  const pairs: any = { ")": "(", "}": "{", "]": "[" };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;
    const trimmed = raw.trim();

    if (trimmed.length === 0 || trimmed.startsWith("//")) continue;

    const indentMatch = raw.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] : "";

    // no mezclar tabs y espacios
    if (/ /.test(indent) && /\t/.test(indent)) {
      problems.push({
        line: lineNo,
        column: 1,
        endColumn: indent.length + 1,
        message: "Indentación inconsistente: no mezcle tabulaciones y espacios.",
        severity: "error",
      });
    }

    // indentación múltiplo de 4 (espacios) / tabs cuentan como 4
    const normalizedIndent = indent.replace(/\t/g, "    ").length;
    if (normalizedIndent % 4 !== 0) {
      problems.push({
        line: lineNo,
        column: 1,
        endColumn: indent.length + 1,
        message: `Indentación inválida (${normalizedIndent} espacios): debe ser múltiplo de 4.`,
        severity: "warning",
      });
    }

    //  secciones
    if (/^features\b/.test(trimmed)) {
      inFeatures = true;
      inConstraints = false;
    } else if (/^constraints\b/.test(trimmed)) {
      inConstraints = true;
      inFeatures = false;
    } else if (/^namespace\b|^imports\b/.test(trimmed)) {
      inFeatures = false;
      inConstraints = false;
      if (normalizedIndent !== 0) {
        problems.push({
          line: lineNo,
          column: 1,
          endColumn: indent.length + 1,
          message: "Las declaraciones de nivel superior (namespace/imports) no deben estar indentadas.",
          severity: "error",
        });
      }
    } else if ((inFeatures || inConstraints) && normalizedIndent === 0) {
      problems.push({
        line: lineNo,
        column: 1,
        endColumn: Math.max(2, trimmed.length + 1),
        message: `Se esperaba indentación dentro de '${inFeatures ? "features" : "constraints"}'.`,
        severity: "error",
      });
    }

    // Regla 4: keywords de grupo deben estar indentadas
    const firstWord = trimmed.split(/\s+/)[0];
    if (groupKeywords.indexOf(firstWord) >= 0 && normalizedIndent === 0) {
      problems.push({
        line: lineNo,
        column: 1,
        endColumn: trimmed.length + 1,
        message: `El modificador de grupo '${firstWord}' debe estar indentado bajo una feature padre.`,
        severity: "error",
      });
    }

    // brackets balanceados (a lo largo del documento)
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (ch === "(" || ch === "{" || ch === "[") {
        bracketStack.push({ ch, line: lineNo, col: c + 1 });
      } else if (ch === ")" || ch === "}" || ch === "]") {
        const top = bracketStack[bracketStack.length - 1];
        if (!top || top.ch !== pairs[ch]) {
          problems.push({
            line: lineNo,
            column: c + 1,
            endColumn: c + 2,
            message: `Bracket de cierre '${ch}' no coincide.`,
            severity: "error",
          });
        } else {
          bracketStack.pop();
        }
      }
    }
  }

  // Brackets sin cerrar
  for (const open of bracketStack) {
    problems.push({
      line: open.line,
      column: open.col,
      endColumn: open.col + 1,
      message: `Bracket '${open.ch}' nunca se cierra.`,
      severity: "error",
    });
  }

  return problems;
}

const UVL_LANGUAGE_ID = "uvl";

const uvlMonarchTokens: any = {
  defaultToken: "",
  tokenPostfix: ".uvl",

  keywords: [
    "namespace",
    "imports",
    "as",
    "include",
    "features",
    "constraints",
    "mandatory",
    "optional",
    "or",
    "alternative",
    "abstract",
    "Boolean",
    "Integer",
    "Real",
    "String",
    "cardinality",
    "true",
    "false",
  ],

  operators: [
    "=>",
    "<=>",
    "&",
    "|",
    "!",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "+",
    "-",
    "*",
    "/",
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [/[A-Za-z_][\w]*/, {
        cases: {
          "@keywords": "keyword",
          "@default": "identifier",
        },
      }],
      { include: "@whitespace" },
      [/[{}()\[\]]/, "@brackets"],
      [/[,.;]/, "delimiter"],
      [/\d+\.\d+/, "number.float"],
      [/\d+/, "number"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      [/@symbols/, {
        cases: {
          "@operators": "operator",
          "@default": "",
        },
      }],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\/.*$/, "comment"],
    ],
  },
};

const uvlLanguageConfig: any = {
  comments: { lineComment: "//" },
  brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
};

class UvlEditor extends Component<UvlEditorProps, UvlEditorState> {
  // referencias a Monaco/editor + input de archivo + debounce 
  private monacoRef: Monaco | null = null;
  private editorRef: any = null;
  private fileInputRef = React.createRef<HTMLInputElement>();
  private validateTimer: any = null;

  constructor(props: UvlEditorProps) {
    super(props);
    this.state = {
      value:
        (props.model && (props.model as any).uvl) ||
        "namespace Example\n\nfeatures\n    Root {abstract}\n        mandatory\n            FeatureA\n        optional\n            FeatureB\n\nconstraints\n    FeatureA => !FeatureB\n",
      fileName: "",
      problemCount: 0,
    };
  }

  componentWillUnmount() {
    if (this.validateTimer) clearTimeout(this.validateTimer);
  }

  handleBeforeMount = (monaco: Monaco) => {
    const languages = monaco.languages.getLanguages();
    if (!languages.find((l: any) => l.id === UVL_LANGUAGE_ID)) {
      monaco.languages.register({ id: UVL_LANGUAGE_ID });
      monaco.languages.setMonarchTokensProvider(UVL_LANGUAGE_ID, uvlMonarchTokens);
      monaco.languages.setLanguageConfiguration(UVL_LANGUAGE_ID, uvlLanguageConfig);
    }
  };

  handleChange = (value: string | undefined) => {
    const v = value ?? "";
    this.setState({ value: v });
    if (this.props.model) {
      (this.props.model as any).uvl = v;
    }
    // validación con debounce 
    this.scheduleValidation(v);
  };

  // captura instancias de editor y monaco al montar
  handleEditorMount = (editor: any, monaco: Monaco) => {
    this.editorRef = editor;
    this.monacoRef = monaco;
    // primera validación al cargar
    this.scheduleValidation(this.state.value, 0);
  };

  //agendar validación con debounce (400ms)
  scheduleValidation = (text: string, delay: number = 400) => {
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => this.runValidation(text), delay);
  };

  //ejecutar validación y aplicar markers
  runValidation = (text: string) => {
    if (!this.monacoRef || !this.editorRef) return;
    const monaco = this.monacoRef;
    const model = this.editorRef.getModel();
    if (!model) return;

    const problems = validateUvlText(text);
    const markers = problems.map((p) => ({
      startLineNumber: p.line,
      startColumn: p.column,
      endLineNumber: p.line,
      endColumn: p.endColumn,
      message: p.message,
      severity:
        p.severity === "error"
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, UVL_MARKER_OWNER, markers);
    this.setState({ problemCount: problems.length });
  };

  // abrir selector de archivos
  handleOpenFileDialog = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = ""; // permite recargar el mismo archivo
      this.fileInputRef.current.click();
    }
  };

  // ===== NUEVO: leer archivo .uvl con FileReader =====
  handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      this.setState({ value: content, fileName: file.name });
      if (this.props.model) {
        (this.props.model as any).uvl = content;
      }
      this.scheduleValidation(content, 0);
    };
    reader.onerror = () => {
      console.error("UvlEditor: no se pudo leer el archivo", reader.error);
    };
    reader.readAsText(file);
  };

  // drag & drop sobre la cabecera 
  handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) ?? "";
      this.setState({ value: content, fileName: file.name });
      if (this.props.model) {
        (this.props.model as any).uvl = content;
      }
      this.scheduleValidation(content, 0);
    };
    reader.readAsText(file);
  };

  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 100px)",
          boxSizing: "border-box",
          border: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Barra superior (cabecera)  */}
        <div
          onDragOver={this.handleDragOver}
          onDrop={this.handleDrop}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderBottom: "1px solid #e0e0e0",
            background: "#f7f7f7",
            fontSize: 13,
          }}
          title="Puedes arrastrar y soltar un archivo .uvl aquí"
        >
          <button
            type="button"
            onClick={this.handleOpenFileDialog}
            style={{
              padding: "4px 10px",
              border: "1px solid #bbb",
              background: "#fff",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Cargar archivo .uvl
          </button>
          {/* input oculto controlado por el botón */}
          <input
            ref={this.fileInputRef}
            type="file"
            accept=".uvl,text/plain"
            style={{ display: "none" }}
            onChange={this.handleFileSelected}
          />
          <span style={{ color: "#555" }}>
            {this.state.fileName
              ? `Archivo: ${this.state.fileName}`
              : "Sin archivo cargado (o arrastra aquí un .uvl)"}
          </span>
          <span style={{ marginLeft: "auto", color: this.state.problemCount > 0 ? "#b00020" : "#2e7d32" }}>
            {this.state.problemCount > 0
              ? `${this.state.problemCount} problema(s) de formato`
              : "Formato OK"}
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          width="100%"
          language={UVL_LANGUAGE_ID}
          theme="vs"
          value={this.state.value}
          beforeMount={this.handleBeforeMount}
          onMount={this.handleEditorMount}
          onChange={this.handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
        </div>
      </div>
    );
  }
}

export default UvlEditor;

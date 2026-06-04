import React, { useEffect, useRef } from "react";
import { EditorView, lineNumbers, keymap, highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor, highlightActiveLineGutter, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { foldKeymap, bracketMatching, indentOnInput, foldGutter } from "@codemirror/language";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { json } from "@codemirror/lang-json";

interface QueryWriterProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
}

function QueryWriter({ query, setQuery }: Readonly<QueryWriterProps>): JSX.Element {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            viewRef.current = new EditorView({
                doc: query,
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    json(),
                    history(),
                    drawSelection(),
                    EditorState.tabSize.of(4),
                    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap, ...closeBracketsKeymap, ...lintKeymap]),
                    autocompletion(),
                    closeBrackets(),
                    rectangularSelection(),
                    crosshairCursor(),
                    highlightSpecialChars(),
                    highlightSelectionMatches(),
                    bracketMatching(),
                    foldGutter(),
                    indentOnInput(),
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        if (update.docChanged) {
                            setQuery(update.state.doc.toString());
                        }
                    }),
                ],
                parent: editorRef.current,
            });
        }

        return () => {
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
    }, []);

    // Update editor document when query prop changes from parent
    useEffect(() => {
        if (viewRef.current) {
            const currentDoc = viewRef.current.state.doc.toString();
            if (currentDoc !== query) {
                const transaction = viewRef.current.state.update({
                    changes: { from: 0, to: currentDoc.length, insert: query }
                });
                viewRef.current.dispatch(transaction);
            }
        }
    }, [query]);

    return <div id="query-writer" ref={editorRef}></div>;
}

export default QueryWriter;
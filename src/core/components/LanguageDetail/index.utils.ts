export function formatCode(code: string) {
  return code ? JSON.stringify(code, null, "  ") : "{}";
}

export function capitalize(word) {
  return word ? `${word.charAt(0).toUpperCase()}${word.toLowerCase().slice(1)}` : "";
}

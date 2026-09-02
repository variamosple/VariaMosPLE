import { normalizeUvlSubmodelPath, type UvlSubmodelSources } from "./uvlComposition";

export const UVL_WORKSPACE_STORAGE_VERSION = 1;
export const UVL_ROOT_SOURCE_PATH = "__root__.uvl";

export type UvlPersistedWorkspace = {
  version: number;
  rootSource: string;
  rootFileName?: string;
  submodels: Record<string, string>;
  updatedAt: number;
};

export type UvlWorkspaceInput = Omit<Partial<UvlPersistedWorkspace>, "submodels"> & {
  submodels?: UvlSubmodelSources;
};

const STORAGE_PREFIX = "variamos.uvlEditor.workspace";
const memoryStore = new Map<string, string>();

function getBrowserStorage(): Storage | undefined {
  try {
    if (typeof window === "undefined" || !window.localStorage) return undefined;
    return window.localStorage;
  } catch (_error) {
    // Private browsing and locked-down iframes can expose localStorage but
    // throw on access.  The in-memory fallback keeps the editor functional.
    return undefined;
  }
}

function readStorage(key: string): string | null {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch (_error) {
      // Fall through to the process-local store.
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeStorage(key: string, value: string): void {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch (_error) {
      // Fall through to the process-local store.
    }
  }
  memoryStore.set(key, value);
}

function deleteStorage(key: string): void {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch (_error) {
      // Ignore and clear the process-local fallback below.
    }
  }
  memoryStore.delete(key);
}

function sourceMapToRecord(sources: UvlSubmodelSources | undefined): Record<string, string> {
  if (!sources) return {};
  const entries = sources instanceof Map
    ? Array.from(sources.entries())
    : Array.isArray(sources)
      ? sources.map((entry) => [entry.path, entry.source] as [string, string])
      : Object.entries(sources);
  return entries.reduce<Record<string, string>>((result, [path, source]) => {
    const normalizedPath = normalizeUvlSubmodelPath(path);
    if (normalizedPath) result[path] = String(source ?? "");
    return result;
  }, {});
}

function normalizeWorkspace(value: any): UvlPersistedWorkspace | null {
  if (!value || typeof value !== "object") return null;
  const rootSource = typeof value.rootSource === "string" ? value.rootSource : "";
  const rawSubmodels = value.submodels && typeof value.submodels === "object" ? value.submodels : {};
  const submodels = Object.entries(rawSubmodels).reduce<Record<string, string>>((result, [path, source]) => {
    if (typeof source !== "string") return result;
    const normalizedPath = normalizeUvlSubmodelPath(path);
    if (normalizedPath) result[path] = source;
    return result;
  }, {});
  return {
    version: Number(value.version) || UVL_WORKSPACE_STORAGE_VERSION,
    rootSource,
    rootFileName: typeof value.rootFileName === "string" ? value.rootFileName : undefined,
    submodels,
    updatedAt: Number(value.updatedAt) || 0,
  };
}

/** Creates a stable storage key for one project/model pair. */
export function getUvlWorkspaceKey(projectId: unknown, modelId: unknown): string {
  const project = String(projectId ?? "default-project").trim() || "default-project";
  const model = String(modelId ?? "default-model").trim() || "default-model";
  return `${STORAGE_PREFIX}:${encodeURIComponent(project)}:${encodeURIComponent(model)}`;
}

/** Reads persisted UVL text and imported submodels, returning null if absent/corrupt. */
export function loadUvlWorkspace(key: string): UvlPersistedWorkspace | null {
  const serialized = readStorage(key);
  if (!serialized) return null;
  try {
    return normalizeWorkspace(JSON.parse(serialized));
  } catch (_error) {
    return null;
  }
}

/** Persists the root file and all imported files atomically. */
export function saveUvlWorkspace(key: string, workspace: UvlWorkspaceInput): UvlPersistedWorkspace {
  const previous = loadUvlWorkspace(key);
  const normalized: UvlPersistedWorkspace = {
    version: UVL_WORKSPACE_STORAGE_VERSION,
    rootSource: typeof workspace.rootSource === "string" ? workspace.rootSource : (previous?.rootSource || ""),
    rootFileName: workspace.rootFileName ?? previous?.rootFileName,
    submodels: workspace.submodels === undefined ? (previous?.submodels || {}) : sourceMapToRecord(workspace.submodels),
    updatedAt: Date.now(),
  };
  writeStorage(key, JSON.stringify(normalized));
  return normalized;
}

/** Removes persisted text for a model (used when a project/model is deleted). */
export function clearUvlWorkspace(key: string): void {
  deleteStorage(key);
}

/**
 * Copies the persisted fields onto the in-memory model.  ProjectService saves
 * models with JSON.stringify, so these enumerable properties survive the
 * existing session/server project persistence without changing that service.
 */
export function attachUvlWorkspaceToModel(model: any, workspace: UvlPersistedWorkspace | null): void {
  if (!model || !workspace) return;
  model.uvlSubmodels = { ...workspace.submodels };
  model.uvlPersistence = {
    version: workspace.version,
    rootFileName: workspace.rootFileName,
    updatedAt: workspace.updatedAt,
  };
  if (!model.uvl && workspace.rootSource) model.uvl = workspace.rootSource;
}

/** Reads submodel sources embedded in a model loaded from project persistence. */
export function submodelsFromModel(model: any): Record<string, string> {
  const raw = model?.uvlSubmodels;
  if (!raw || typeof raw !== "object") return {};
  return Object.entries(raw).reduce<Record<string, string>>((result, [path, source]) => {
    if (typeof source === "string" && normalizeUvlSubmodelPath(path)) result[path] = source;
    return result;
  }, {});
}

/**
 * Persists text and mirrors it to the model so the normal ProjectService save
 * path also contains the latest editable content.
 */
export function persistUvlWorkspace(
  key: string,
  model: any,
  rootSource: string,
  submodels: UvlSubmodelSources | undefined,
  rootFileName?: string
): UvlPersistedWorkspace {
  const workspace = saveUvlWorkspace(key, { rootSource, submodels, rootFileName });
  attachUvlWorkspaceToModel(model, workspace);
  if (model) model.uvl = rootSource;
  return workspace;
}

/** Updates one imported file while retaining the rest of the workspace. */
export function persistUvlSubmodel(
  key: string,
  model: any,
  path: string,
  source: string,
  rootSource = String(model?.uvl || ""),
  rootFileName?: string
): UvlPersistedWorkspace {
  const submodels = submodelsFromModel(model);
  submodels[path] = String(source ?? "");
  return persistUvlWorkspace(key, model, rootSource, submodels, rootFileName);
}

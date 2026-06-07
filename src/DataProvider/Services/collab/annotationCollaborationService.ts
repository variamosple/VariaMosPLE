import * as Y from "yjs";
import { getProjectState } from "./collaborationService";

const getAnnotationState = (projectId: string, modelId: string): Y.Map<any> | null => {
    const projectState = getProjectState(projectId);
    if (!projectState) return null;

    let annotationState = projectState.get(`annotations_${modelId}`) as Y.Map<any>;

    if (!annotationState) {
        annotationState = new Y.Map<any>();
        projectState.set(`annotations_${modelId}`, annotationState);
    }

    return annotationState;
};

export const publishAnnotation = (projectId: string, modelId: string, annotation: any) => {
    const state = getAnnotationState(projectId, modelId);
    if (!state || !annotation?.id) return;

    state.set(annotation.id, {
        ...annotation,
        deleted: false,
        updatedAt: new Date().toISOString(),
    });
};

export const syncInitialAnnotations = (projectId: string, modelId: string, annotations: any[]) => {
    const state = getAnnotationState(projectId, modelId);
    if (!state) return;

    annotations.forEach((item) => {
        if (item?.id) {
            state.set(item.id, {
                ...item,
                modelId,
                deleted: false,
                updatedAt: item.updatedAt || new Date().toISOString(),
            });
        }
    });
};

export const removeAnnotation = (projectId: string, modelId: string, annotationId: string) => {
    const state = getAnnotationState(projectId, modelId);
    if (!state || !annotationId) return;

    state.set(annotationId, {
        id: annotationId,
        deleted: true,
        updatedAt: new Date().toISOString(),
    });
};

export const observeAnnotations = (projectId: string, modelId: string, callback: (annotations: any[]) => void): (() => void) => {
    const state = getAnnotationState(projectId, modelId);
    if (!state) return () => { };

    const emit = () => {
        const annotations = Array.from(state.values()).filter((item: any) => item && !item.deleted);
        callback(annotations);
    };

    emit();

    const observer = () => emit();
    state.observe(observer);

    return () => {
        state.unobserve(observer);
    };
};
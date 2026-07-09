import { MockYMap } from "./mocks";

describe("annotationCollaborationService", () => {
  const PROJECT_ID = "proj-ann";
  const MODEL_ID = "model-ann";
  const ANNOTATIONS_KEY = `annotations_${MODEL_ID}`;

  let store: Map<string, any>;
  let publishAnnotation: any;
  let syncInitialAnnotations: any;
  let removeAnnotation: any;
  let observeAnnotations: any;

  beforeEach(() => {
    jest.resetModules();

    store = new Map<string, any>();
    store.set(PROJECT_ID, new MockYMap());

    jest.doMock("yjs", () => ({
      Map: MockYMap,
    }));

    jest.doMock("../collaborationService", () => ({
      getProjectState: jest.fn((projectId: string) =>
        store.has(projectId) ? store.get(projectId) : null
      ),
    }));

    const service = require("../annotationCollaborationService");

    publishAnnotation = service.publishAnnotation;
    syncInitialAnnotations = service.syncInitialAnnotations;
    removeAnnotation = service.removeAnnotation;
    observeAnnotations = service.observeAnnotations;
  });

  it("publishes an annotation in the shared Yjs state", () => {
    publishAnnotation(PROJECT_ID, MODEL_ID, {
      id: "a1",
      x: 10,
      y: 20,
      comment: {
        text: "Initial comment",
        userName: "Luis",
      },
      replies: [],
      isResolved: false,
    });

    const projectState = store.get(PROJECT_ID);
    const annotationState = projectState.get(ANNOTATIONS_KEY);
    const stored = annotationState.get("a1");

    expect(stored).toBeDefined();
    expect(stored.id).toBe("a1");
    expect(stored.x).toBe(10);
    expect(stored.y).toBe(20);
    expect(stored.comment.text).toBe("Initial comment");
    expect(stored.replies).toEqual([]);
    expect(stored.isResolved).toBe(false);
    expect(stored.deleted).toBe(false);
    expect(stored.updatedAt).toBeDefined();
  });

  it("syncs initial annotations into the shared Yjs state", () => {
    syncInitialAnnotations(PROJECT_ID, MODEL_ID, [
      {
        id: "a1",
        x: 1,
        y: 2,
        comment: { text: "First annotation" },
        replies: [],
      },
      {
        id: "a2",
        x: 3,
        y: 4,
        comment: { text: "Second annotation" },
        replies: [{ text: "Reply" }],
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);

    const projectState = store.get(PROJECT_ID);
    const annotationState = projectState.get(ANNOTATIONS_KEY);

    expect(annotationState.get("a1").modelId).toBe(MODEL_ID);
    expect(annotationState.get("a1").deleted).toBe(false);
    expect(annotationState.get("a2").replies).toEqual([{ text: "Reply" }]);
    expect(annotationState.get("a2").updatedAt).toBe(
      "2024-01-01T00:00:00.000Z"
    );
  });

  it("marks an annotation as deleted in the shared Yjs state", () => {
    publishAnnotation(PROJECT_ID, MODEL_ID, {
      id: "a1",
      x: 10,
      y: 20,
      comment: { text: "Annotation to delete" },
    });

    removeAnnotation(PROJECT_ID, MODEL_ID, "a1");

    const projectState = store.get(PROJECT_ID);
    const stored = projectState.get(ANNOTATIONS_KEY).get("a1");

    expect(stored.id).toBe("a1");
    expect(stored.deleted).toBe(true);
    expect(stored.updatedAt).toBeDefined();
  });

  it("emits existing non-deleted annotations when observation starts", () => {
    publishAnnotation(PROJECT_ID, MODEL_ID, { id: "a1", x: 1 });
    publishAnnotation(PROJECT_ID, MODEL_ID, { id: "a2", x: 2 });

    const callback = jest.fn();
    const unsubscribe = observeAnnotations(PROJECT_ID, MODEL_ID, callback);

    expect(callback).toHaveBeenCalledTimes(1);

    const [annotations] = callback.mock.calls[0];

    expect(annotations.map((item: any) => item.id).sort()).toEqual([
      "a1",
      "a2",
    ]);

    unsubscribe();
  });

  it("updates observers when annotations are added or deleted", () => {
    const callback = jest.fn();
    const unsubscribe = observeAnnotations(PROJECT_ID, MODEL_ID, callback);

    callback.mockClear();

    publishAnnotation(PROJECT_ID, MODEL_ID, { id: "a1", x: 1 });

    let [annotations] = callback.mock.calls[callback.mock.calls.length - 1];

    expect(annotations.map((item: any) => item.id)).toEqual(["a1"]);

    removeAnnotation(PROJECT_ID, MODEL_ID, "a1");

    [annotations] = callback.mock.calls[callback.mock.calls.length - 1];

    expect(annotations).toEqual([]);

    unsubscribe();
  });

  it("stops updating observers after unsubscribing", () => {
    const callback = jest.fn();
    const unsubscribe = observeAnnotations(PROJECT_ID, MODEL_ID, callback);

    callback.mockClear();
    unsubscribe();

    publishAnnotation(PROJECT_ID, MODEL_ID, { id: "a1", x: 1 });

    expect(callback).not.toHaveBeenCalled();
  });
});
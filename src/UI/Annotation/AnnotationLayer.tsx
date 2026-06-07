import React, { useEffect, useRef, useState } from "react";
import { ProjectAnnotation } from "../../Domain/ProductLineEngineering/Entities/ProjectAnnotation";
import DeleteAnnotationConfirmationModal from "./Components/DeleteAnnotationConfirmationModal";
import AnnotationBubble from "./Components/AnnotationBubble";
import AnnotationThreadPanel from "./Components/AnnotationThreadPanel";
import "./AnnotationLayer.css";

interface Props {
    graph: any;
    projectId: string;
    modelId: string;
    projectService: any;
    annotations: any[];
    pendingAnnotation?: any;
    onCreate: (annotation: ProjectAnnotation) => void;
    onUpdate: (annotationId: string, annotation: any) => void;
    onDelete: (annotationId: string) => void;
    onResolve: (annotationId: string) => void;
    onCancelPending?: () => void;
}

export default function AnnotationLayer({
    graph,
    annotations,
    pendingAnnotation,
    projectService,
    onCreate,
    onUpdate,
    onDelete,
    onResolve,
    onCancelPending,
}: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [annotationToDelete, setAnnotationToDelete] = useState<any | null>(null);

    const markerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const dragFrameRef = useRef<number | null>(null);
    const dragPreviewRef = useRef<any | null>(null);
    const draggingIdRef = useRef<string | null>(null);
    const isDraggingRef = useRef(false);
    const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);
    const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const getCurrentUser = () => {
        const currentUserId =
            projectService.getUser?.() ||
            projectService.getCurrentUser?.()?.id ||
            projectService.getProjectInformation?.()?.user?.id;

        const projectInfo = projectService.getProjectInformation?.();
        const collaborators = projectInfo?.collaborators || [];

        const currentUser = collaborators.find(
            (collab: any) => String(collab.id) === String(currentUserId)
        );

        return {
            id: currentUserId,
            name:
                currentUser?.name ||
                currentUser?.email ||
                projectService.getCurrentUser?.()?.name ||
                "User",
        };
    };

    const canDeleteThread = (item: any) => {
        const currentUser = getCurrentUser();

        return (
            String(item.userId) === String(currentUser.id) ||
            String(item.user_id) === String(currentUser.id) ||
            String(item.annotation?.comment?.userId) === String(currentUser.id) ||
            String(item.annotation?.comment?.user_id) === String(currentUser.id)
        );
    };

    const getScreenPosition = (item: any) => {
        const position = item?.annotation?.position;
        if (!position || !graph) return null;

        try {
            const view = graph.getView();
            if (!view) return null;

            const scale = view.scale;
            const translate = view.translate;

            return {
                x: (position.x + translate.x) * scale,
                y: (position.y + translate.y) * scale,
            };
        } catch {
            return null;
        }
    };

    const getGraphPositionFromScreen = (screenX: number, screenY: number) => {
        const view = graph.getView();
        const scale = view.scale;
        const translate = view.translate;

        return {
            x: screenX / scale - translate.x,
            y: screenY / scale - translate.y,
        };
    };

    const handleMarkerClick = (id: string) => {
        if (isDraggingRef.current) return;
        setSelectedId(selectedId === id ? null : id);
    };

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (!id || !graph?.container) return;

        draggingIdRef.current = id;
        isDraggingRef.current = false;
        dragPreviewRef.current = null;
        lastDragPositionRef.current = null;

        const marker = markerRefs.current[id];
        const rect = graph.container.getBoundingClientRect();

        if (marker) {
            const markerLeft = parseFloat(marker.style.left || "0");
            const markerTop = parseFloat(marker.style.top || "0");

            dragOffsetRef.current = {
                x: e.clientX - rect.left - markerLeft,
                y: e.clientY - rect.top - markerTop,
            };
        } else {
            dragOffsetRef.current = { x: 0, y: 0 };
        }

        mouseDownPositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        setDraggingId(id);
        setSelectedId(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const currentDraggingId = draggingIdRef.current;
        const startPosition = mouseDownPositionRef.current;

        if (!currentDraggingId || !startPosition || !graph?.container) return;

        const distance = Math.sqrt(
            Math.pow(e.clientX - startPosition.x, 2) +
            Math.pow(e.clientY - startPosition.y, 2)
        );

        if (distance < 4) return;

        isDraggingRef.current = true;

        const rect = graph.container.getBoundingClientRect();

        const screenX = e.clientX - rect.left - dragOffsetRef.current.x;
        const screenY = e.clientY - rect.top - dragOffsetRef.current.y;

        lastDragPositionRef.current = {
            x: screenX,
            y: screenY,
        };

        if (!dragFrameRef.current) {
            dragFrameRef.current = requestAnimationFrame(() => {
                const marker = markerRefs.current[currentDraggingId];
                const position = lastDragPositionRef.current;

                if (marker && position) {
                    marker.style.left = `${position.x}px`;
                    marker.style.top = `${position.y}px`;
                }

                dragFrameRef.current = null;
            });
        }

        const annotation = annotations.find((item) => item.id === currentDraggingId);
        if (!annotation?.id) return;

        dragPreviewRef.current = {
            ...annotation,
            annotation: {
                ...annotation.annotation,
                position: getGraphPositionFromScreen(screenX, screenY),
            },
        };
    };

    const handleMouseUp = () => {
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }

        const currentDraggingId = draggingIdRef.current;
        const currentDragPreview = dragPreviewRef.current;

        if (currentDraggingId && currentDragPreview?.id === currentDraggingId) {
            onUpdate(currentDraggingId, currentDragPreview);
        }

        setDraggingId(null);

        draggingIdRef.current = null;
        dragPreviewRef.current = null;
        lastDragPositionRef.current = null;
        mouseDownPositionRef.current = null;
        dragOffsetRef.current = { x: 0, y: 0 };

        setTimeout(() => {
            isDraggingRef.current = false;
        }, 0);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            if (dragFrameRef.current) {
                cancelAnimationFrame(dragFrameRef.current);
            }
        };
    });

    useEffect(() => {
        const handleCloseAnnotations = () => {
            setSelectedId(null);
        };

        window.addEventListener("closeAnnotations", handleCloseAnnotations);

        return () => {
            window.removeEventListener("closeAnnotations", handleCloseAnnotations);
        };
    }, []);

    const createPendingComment = () => {
        if (!pendingAnnotation || !newCommentText.trim()) return;

        const currentUser = getCurrentUser();

        const annotation = new ProjectAnnotation(
            pendingAnnotation.projectId,
            pendingAnnotation.modelId,
            {
                position: pendingAnnotation.position,
                comment: {
                    text: newCommentText.trim(),
                    createdAt: new Date().toISOString(),
                    userId: currentUser.id,
                    userName: currentUser.name,
                },
                replies: [],
            }
        );

        onCreate(annotation);
        setNewCommentText("");
    };

    const requestDeleteAnnotation = (item: any) => {
        setAnnotationToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDeleteAnnotation = () => {
        if (annotationToDelete?.id) {
            onDelete(annotationToDelete.id);
        }

        setShowDeleteModal(false);
        setAnnotationToDelete(null);
        setSelectedId(null);
    };

    const cancelDeleteAnnotation = () => {
        setShowDeleteModal(false);
        setAnnotationToDelete(null);
    };

    const formatDate = (date?: string) => {
        if (!date) return "";
        const createdAt = new Date(date);
        const now = new Date();
        const diffSeconds = Math.floor(
            (now.getTime() - createdAt.getTime()) / 1000
        );
        if (diffSeconds < 5) {
            return "just now";
        }
        if (diffSeconds < 60) {
            return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
        }
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
        }
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        }
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        }
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) {
            return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
        }
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
            return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
        }
        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
    };

    return (
        <div className="annotation-layer">
            {pendingAnnotation && (
                <div
                    className="annotation-item pending-item"
                    style={{
                        left: pendingAnnotation.screenPosition?.x,
                        top: pendingAnnotation.screenPosition?.y,
                        transform: "translate(-50%, -50%)",
                        position: "fixed",
                    }}
                >
                    <div
                        className="annotation-bubble pending selected open"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="annotation-bubble-icon">+</div>
                    </div>

                    <div
                        className="annotation-panel"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="annotation-header">
                            <strong>Comment</strong>

                            <button
                                className="annotation-close-btn"
                                onClick={() => {
                                    setNewCommentText("");
                                    onCancelPending?.();
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="annotation-body">
                            <div className="annotation-reply-box">
                                <input
                                    autoFocus
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Reply"
                                    onKeyDown={(e) => {
                                        e.stopPropagation();

                                        if (e.key === "Enter") {
                                            createPendingComment();
                                        }
                                    }}
                                />

                                <button
                                    disabled={!newCommentText.trim()}
                                    onClick={createPendingComment}
                                >
                                    ↑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {annotations
                .filter(
                    (item) =>
                        item?.annotation?.position &&
                        !item?.isResolved &&
                        !item?.is_resolved
                )
                .map((item) => {
                    const position = getScreenPosition(item);
                    if (!position) return null;

                    const isSelected = selectedId === item.id;
                    const repliesCount = (item.annotation.replies || []).length;
                    const initialComment = item.annotation.comment?.text || "";
                    const userName =
                        item.userName ||
                        item.user_name ||
                        item.annotation?.comment?.userName ||
                        item.annotation?.comment?.user_name ||
                        "User";

                    return (
                        <div
                            key={item.id}
                            ref={(el) => {
                                markerRefs.current[item.id] = el;
                            }}
                            className="annotation-item"
                            style={{
                                left: position.x,
                                top: position.y,
                            }}
                        >
                            <AnnotationBubble
                                userName={userName}
                                date={formatDate(item.createdAt || item.created_at)}
                                comment={initialComment}
                                repliesCount={repliesCount}
                                isSelected={isSelected}
                                onClick={() => handleMarkerClick(item.id)}
                                onMouseDown={(e) => handleMouseDown(e, item.id)}
                            />

                            {isSelected && (
                                <AnnotationThreadPanel
                                    item={item}
                                    currentUser={getCurrentUser()}
                                    formatDate={formatDate}
                                    canDeleteThread={canDeleteThread(item)}
                                    onUpdate={onUpdate}
                                    onDelete={() => requestDeleteAnnotation(item)}
                                    onResolve={() => {
                                        onResolve(item.id);
                                        setSelectedId(null);
                                    }}
                                    onClose={() => setSelectedId(null)}
                                />
                            )}
                        </div>
                    );
                })}

            <DeleteAnnotationConfirmationModal
                show={showDeleteModal}
                onCancel={cancelDeleteAnnotation}
                onConfirm={confirmDeleteAnnotation}
            />
        </div>
    );
}
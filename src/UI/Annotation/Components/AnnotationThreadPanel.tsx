import React, { useState } from "react";
import AnnotationComment from "./AnnotationComment";

interface Props {
    item: any;
    currentUser: { id: string; name: string };
    formatDate: (date?: string) => string;
    canDeleteThread: boolean;
    onUpdate: (annotationId: string, annotation: any) => void;
    onDelete: () => void;
    onResolve: () => void;
    onClose: () => void;
}

export default function AnnotationThreadPanel({
    item,
    currentUser,
    formatDate,
    canDeleteThread,
    onUpdate,
    onDelete,
    onResolve,
    onClose,
}: Props) {
    const [replyText, setReplyText] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const userName =
        item.userName ||
        item.user_name ||
        item.annotation?.comment?.userName ||
        item.annotation?.comment?.user_name ||
        "User";

    const isCurrentUser = (userId?: string) =>
        String(userId) === String(currentUser.id);

    const canEditMainComment = isCurrentUser(
        item.annotation?.comment?.userId ||
        item.annotation?.comment?.user_id ||
        item.userId ||
        item.user_id
    );

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditingReplyId(null);
        setEditText("");
    };

    const startEditComment = () => {
        setEditingCommentId(item.id);
        setEditingReplyId(null);
        setEditText(item.annotation?.comment?.text || "");
        setMenuOpen(false);
    };

    const saveCommentEdit = () => {
        if (!editText.trim()) return;

        onUpdate(item.id, {
            ...item,
            annotation: {
                ...item.annotation,
                comment: {
                    ...item.annotation.comment,
                    text: editText.trim(),
                    editedAt: new Date().toISOString(),
                },
            },
        });

        cancelEdit();
    };

    const startEditReply = (reply: any) => {
        setEditingReplyId(reply.id);
        setEditingCommentId(null);
        setEditText(reply.text || "");
    };

    const saveReplyEdit = (replyId: string) => {
        if (!editText.trim()) return;

        onUpdate(item.id, {
            ...item,
            annotation: {
                ...item.annotation,
                replies: (item.annotation.replies || []).map((reply: any) =>
                    reply.id === replyId
                        ? {
                            ...reply,
                            text: editText.trim(),
                            editedAt: new Date().toISOString(),
                        }
                        : reply
                ),
            },
        });

        cancelEdit();
    };

    const sendReply = () => {
        if (!replyText.trim()) return;

        const updated = {
            ...item,
            annotation: {
                ...item.annotation,
                replies: [
                    ...(item.annotation.replies || []),
                    {
                        id: `${Date.now()}`,
                        text: replyText.trim(),
                        createdAt: new Date().toISOString(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                    },
                ],
            },
        };

        onUpdate(item.id, updated);
        setReplyText("");
    };

    return (
        <div
            className="annotation-panel"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="annotation-header">
                <strong>Comment</strong>

                <div className="annotation-actions">
                    <button
                        className="annotation-menu-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                    >
                        ⋯
                    </button>

                    {menuOpen && (
                        <div className="annotation-menu">
                            {canDeleteThread && (
                                <button onClick={onDelete}>
                                    Delete thread
                                </button>
                            )}

                            <button onClick={onResolve}>
                                Mark as resolved
                            </button>
                        </div>
                    )}

                    <button
                        className="annotation-close-btn"
                        onClick={() => {
                            cancelEdit();
                            onClose();
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="annotation-body">
                <AnnotationComment
                    id={item.id}
                    userName={userName}
                    date={formatDate(item.createdAt || item.created_at)}
                    text={item.annotation?.comment?.text || ""}
                    editedAt={item.annotation?.comment?.editedAt}
                    canEdit={canEditMainComment}
                    isEditing={editingCommentId === item.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onStartEdit={startEditComment}
                    onSaveEdit={saveCommentEdit}
                    onCancelEdit={cancelEdit}
                />

                {(item.annotation.replies || []).map((reply: any) => {
                    const replyUserName =
                        reply.userName ||
                        reply.user_name ||
                        "User";

                    const canEditReply = isCurrentUser(reply.userId || reply.user_id);

                    return (
                        <AnnotationComment
                            key={reply.id}
                            id={reply.id}
                            userName={replyUserName}
                            date={formatDate(reply.createdAt || reply.created_at)}
                            text={reply.text}
                            editedAt={reply.editedAt}
                            isReply
                            canEdit={canEditReply}
                            isEditing={editingReplyId === reply.id}
                            editText={editText}
                            onEditTextChange={setEditText}
                            onStartEdit={() => startEditReply(reply)}
                            onSaveEdit={() => saveReplyEdit(reply.id)}
                            onCancelEdit={cancelEdit}
                        />
                    );
                })}

                <div className="annotation-reply-box">
                    <div className="annotation-avatar small">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>

                    <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply"
                        onKeyDown={(e) => {
                            e.stopPropagation();

                            if (e.key === "Enter") {
                                sendReply();
                            }
                        }}
                    />

                    <button disabled={!replyText.trim()} onClick={sendReply}>
                        ↑
                    </button>
                </div>
            </div>
        </div>
    );
}
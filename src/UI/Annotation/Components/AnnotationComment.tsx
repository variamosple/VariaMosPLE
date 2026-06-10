import React from "react";
import AnnotationEditBox from "./AnnotationEditBox";

interface Props {
    id: string;
    userName: string;
    date: string;
    text: string;
    editedAt?: string;
    isReply?: boolean;
    canEdit: boolean;
    isEditing: boolean;
    editText: string;
    onEditTextChange: (value: string) => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
}

export default function AnnotationComment({
    userName,
    date,
    text,
    editedAt,
    isReply = false,
    canEdit,
    isEditing,
    editText,
    onEditTextChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
}: Props) {
    return (
        <div className={`annotation-comment ${isReply ? "reply" : ""}`}>
            <div className="annotation-avatar">
                {userName.charAt(0).toUpperCase()}
            </div>

            <div className="annotation-comment-content">
                <div className="annotation-meta">
                    <strong>{userName}</strong>
                    <span>{date}</span>
                </div>

                {isEditing ? (
                    <AnnotationEditBox
                        value={editText}
                        onChange={onEditTextChange}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                    />
                ) : (
                    <>
                        <p>
                            {text}
                            {editedAt && (
                                <span className="annotation-edited-label"> edited</span>
                            )}
                        </p>

                        {canEdit && (
                            <button
                                className="annotation-edit-link"
                                onClick={onStartEdit}
                            >
                                Edit
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
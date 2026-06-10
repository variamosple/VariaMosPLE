import React from "react";

interface Props {
    userName: string;
    date: string;
    comment: string;
    repliesCount: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
}

export default function AnnotationBubble({
    userName,
    date,
    comment,
    repliesCount,
    isSelected,
    onClick,
    onMouseDown,
}: Props) {
    return (
        <div
            className={`annotation-bubble ${isSelected ? "selected open" : ""}`}
            onClick={onClick}
            onMouseDown={onMouseDown}
        >
            <div className="annotation-bubble-icon">
                {userName.charAt(0).toUpperCase()}
            </div>

            <div className="annotation-bubble-content">
                <div className="annotation-bubble-meta">
                    <strong>{userName}</strong>
                    <span>{date}</span>
                </div>

                <p>{comment}</p>

                <small>
                    {repliesCount} {repliesCount === 1 ? "reply" : "replies"}
                </small>
            </div>
        </div>
    );
}
import React, { useEffect, useState } from "react";
import { Nav, Offcanvas } from "react-bootstrap";
import "./AnnotationLayer.css";

interface Props {
    show: boolean;
    onHide: () => void;
    annotations: any[];
    currentUser: {
        id: string;
        name: string;
    };
}

export default function AnnotationPanel({
    show,
    onHide,
    annotations,
    currentUser,
}: Props) {
    const [filter, setFilter] = useState<"active" | "resolved">("active");

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("toggleResolvedAnnotations", {
                detail: {
                    showResolved: show && filter === "resolved",
                },
            })
        );
    }, [show, filter]);

    const formatDate = (date?: string) => {
        if (!date) return "";
        const createdAt = new Date(date);
        const now = new Date();
        const diffSeconds = Math.floor(
            (now.getTime() - createdAt.getTime()) / 1000
        );
        if (diffSeconds < 5) return "just now";
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

    const getUserName = (item: any) => {
        return (
            item.userName ||
            item.user_name ||
            item.annotation?.comment?.userName ||
            item.annotation?.comment?.user_name ||
            "User"
        );
    };

    const getCreatedAt = (item: any) => {
        return (
            item.createdAt ||
            item.created_at ||
            item.annotation?.comment?.createdAt ||
            item.annotation?.comment?.created_at
        );
    };

    const getInitialComment = (item: any) => {
        return item.annotation?.comment?.text || "No comment";
    };

    const getRepliesCount = (item: any) => {
        return item.annotation?.replies?.length || 0;
    };

    const filteredAnnotations = annotations
        .filter((item) => {
            const isResolved = item.isResolved || item.is_resolved;

            return filter === "active" ? !isResolved : isResolved;
        })
        .sort((a, b) => {
            const dateA = new Date(getCreatedAt(a) || 0).getTime();
            const dateB = new Date(getCreatedAt(b) || 0).getTime();

            return dateB - dateA;
        });

    const openAnnotationOnCanvas = (item: any) => {
        window.dispatchEvent(
            new CustomEvent("openAnnotation", {
                detail: {
                    annotationId: item.id,
                    isResolved: item.isResolved || item.is_resolved,
                },
            })
        );
    };

    const handleFilterChange = (value: "active" | "resolved") => {
        setFilter(value);

        window.dispatchEvent(new CustomEvent("closeAnnotations"));

        window.dispatchEvent(
            new CustomEvent("toggleResolvedAnnotations", {
                detail: {
                    showResolved: value === "resolved",
                },
            })
        );
    };

    const handleClose = () => {
        window.dispatchEvent(new CustomEvent("closeAnnotations"));

        window.dispatchEvent(
            new CustomEvent("toggleResolvedAnnotations", {
                detail: {
                    showResolved: false,
                },
            })
        );

        onHide();
    };

    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement="end"
            backdrop={false}
            scroll={true}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Comments</Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body>
                <Nav
                    variant="tabs"
                    justify
                    activeKey={filter}
                    onSelect={(key) => handleFilterChange(key as "active" | "resolved")}
                    className="mb-3"
                >
                    <Nav.Item>
                        <Nav.Link eventKey="active">
                            Active
                        </Nav.Link>
                    </Nav.Item>

                    <Nav.Item>
                        <Nav.Link eventKey="resolved">
                            Resolved
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                {filteredAnnotations.length === 0 ? (
                    <p className="text-muted small">
                        No {filter} comments found.
                    </p>
                ) : (
                    filteredAnnotations.map((item, index) => {
                        const userName = getUserName(item);
                        const repliesCount = getRepliesCount(item);

                        return (
                            <div
                                key={item.id}
                                className="border rounded p-2 mb-2 bg-light"
                                style={{ cursor: "pointer" }}
                                onClick={() => openAnnotationOnCanvas(item)}
                            >
                                <div className="d-flex gap-2">
                                    <div className="annotation-avatar">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-grow-1">
                                        <div className="small text-muted">
                                            #{filteredAnnotations.length - index}
                                        </div>

                                        <div className="fw-normal text-dark">
                                            {getInitialComment(item)}
                                        </div>

                                        <div className="small text-muted">
                                            {userName} · {formatDate(getCreatedAt(item))}
                                        </div>

                                        {repliesCount > 0 && (
                                            <div className="small text-primary mt-1">
                                                {repliesCount}{" "}
                                                {repliesCount === 1 ? "reply" : "replies"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
}
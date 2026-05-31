import React, { useState } from "react";
import { Offcanvas, Button } from "react-bootstrap";
import ProjectService from "../../Application/Project/ProjectService";
import RevertConfirmationModal from "./Components/RevertConfirmationModal";

interface Props {
    show: boolean;
    onHide: () => void;
    projectService: ProjectService;
    historyRecords: any[];
    onRefresh: () => void;
    onRevertHistoryItem?: (item: any) => void;
}

export default function GlobalHistoryPanel({
    show,
    onHide,
    historyRecords,
    onRefresh,
    onRevertHistoryItem,
}: Props) {
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

    const globalHistoryRecords = historyRecords.filter((item) => {
        const entityType = String(item.entityType || "").toLowerCase();

        return (
            entityType === "model" ||
            entityType === "productline" ||
            entityType === "product_line" ||
            entityType === "product line" ||
            entityType === "application" ||
            entityType === "adaptation" ||
            entityType === "scope"
        );
    });

    const sortedGlobalHistoryRecords = [...globalHistoryRecords].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
    });

    const isToday = (date: Date) => {
        const today = new Date();

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const getDateTitle = (createdAt: string) => {
        if (!createdAt) return "No date";

        const date = new Date(createdAt);

        if (isToday(date)) {
            return "Today";
        }

        return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const groupedByDay = sortedGlobalHistoryRecords.reduce((groups: any, item: any) => {
        const title = getDateTitle(item.createdAt);

        if (!groups[title]) {
            groups[title] = [];
        }

        groups[title].push(item);

        return groups;
    }, {});

    const openRevertModal = (item: any) => {
        setSelectedHistoryItem(item);
        setShowRevertModal(true);
    };

    const closeRevertModal = () => {
        setSelectedHistoryItem(null);
        setShowRevertModal(false);
    };

    const confirmRevert = () => {
        if (selectedHistoryItem && onRevertHistoryItem) {
            onRevertHistoryItem(selectedHistoryItem);
        }

        closeRevertModal();
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Project history</Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body>
                <div className="d-flex justify-content-end mb-2">
                    <Button size="sm" variant="outline-primary" onClick={onRefresh}>
                        Refresh
                    </Button>
                </div>

                {sortedGlobalHistoryRecords.length === 0 ? (
                    <p className="text-muted small">
                        No project history records found.
                    </p>
                ) : (
                    Object.keys(groupedByDay).map((day) => (
                        <div key={day} className="mb-3">
                            <div className="fw-bold text-muted mb-2">
                                {day}
                            </div>

                            {groupedByDay[day].map((item: any) => (
                                <div key={item.id} className="border rounded p-2 mb-2 bg-light">
                                    <div className="fw-bold">
                                        {item.description || item.actionType}
                                    </div>

                                    <div className="small text-muted mb-2">
                                        {item.author || "Unknown user"} ·{" "}
                                        {item.createdAt
                                            ? new Date(item.createdAt).toLocaleString()
                                            : "No date"}
                                    </div>

                                    {item.oldValue && onRevertHistoryItem && (
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => openRevertModal(item)}
                                            >
                                                Revert
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )}

                <RevertConfirmationModal
                    show={showRevertModal}
                    historyItem={selectedHistoryItem}
                    onCancel={closeRevertModal}
                    onConfirm={confirmRevert}
                />
            </Offcanvas.Body>
        </Offcanvas>
    );
}
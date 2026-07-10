import React, { useState } from "react";
import { Accordion, Button, Offcanvas } from "react-bootstrap";
import RevertConfirmationModal from "./Components/RevertConfirmationModal";
import ProjectService from "../../Application/Project/ProjectService";

interface Props {
  show: boolean;
  onHide: () => void;
  projectService: ProjectService;
  historyRecords: any[];
  selectedModelId?: string;
  onRefresh: () => void;
  onRevertHistoryItem?: (item: any) => void;
  onPreviewHistoryItem?: (item: any) => void;
  onClearHistoryPreview?: () => void;
}

export default function HistoryPanel({
  show,
  onHide,
  historyRecords,
  selectedModelId,
  onRefresh,
  onRevertHistoryItem,
  onPreviewHistoryItem,
  onClearHistoryPreview,
}: Props) {
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  const filteredHistoryRecords = selectedModelId
    ? historyRecords.filter((item) => item.modelId === selectedModelId)
    : historyRecords;

  const sortedHistoryRecords = [...filteredHistoryRecords].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();

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

  const groupedByDay = sortedHistoryRecords.reduce((groups: any, item: any) => {
    const title = getDateTitle(item.createdAt);

    if (!groups[title]) {
      groups[title] = [];
    }

    groups[title].push(item);

    return groups;
  }, {});

  const getChangedFields = (item: any) => {
    if (!item.oldValue || !item.newValue) return [];

    return Object.keys(item.newValue).filter(
      (key) =>
        JSON.stringify(item.oldValue?.[key]) !==
        JSON.stringify(item.newValue?.[key])
    );
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") return "empty";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const openRevertModal = (item: any) => {
    setSelectedHistoryItem(item);
    setShowRevertModal(true);
  };

  const closeRevertModal = () => {
    setShowRevertModal(false);
    setSelectedHistoryItem(null);
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
        <Offcanvas.Title>History</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        <div className="d-flex justify-content-end mb-2">
          <Button size="sm" variant="outline-primary" onClick={onRefresh}>
            Refresh
          </Button>
        </div>

        {sortedHistoryRecords.length === 0 ? (
          <p className="text-muted small">
            No history records found for this model.
          </p>
        ) : (
          Object.keys(groupedByDay).map((day) => (
            <div key={day} className="mb-3">
              <div className="fw-bold text-muted mb-2">
                {day}
              </div>

              {groupedByDay[day].map((item: any) => {
                const changedFields = getChangedFields(item);
                const hasDetails = changedFields.length > 0;

                return (
                  <div
                    key={item.id}
                    className="border rounded p-2 mb-2 bg-light"
                    onMouseEnter={() => onPreviewHistoryItem?.(item)}
                    onMouseLeave={() => onClearHistoryPreview?.()}
                  >
                    <div className="fw-bold">
                      {item.description || item.actionType}
                    </div>

                    <div className="small text-muted mb-2">
                      {item.userName || "Unknown user"} ·{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "No date"}
                    </div>

                    {item.oldValue && onRevertHistoryItem && (
                      <div className="d-flex justify-content-end mb-2">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => openRevertModal(item)}
                        >
                          Revert
                        </Button>
                      </div>
                    )}

                    {hasDetails && (
                      <Accordion flush>
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>
                            <span className="small">
                              View modified fields
                            </span>
                          </Accordion.Header>

                          <Accordion.Body className="small">
                            {changedFields.map((field) => (
                              <div key={field} className="mb-2">
                                <div className="fw-semibold">
                                  {field}
                                </div>
                                <div>
                                  <span className="text-muted">Before:</span>{" "}
                                  {formatValue(item.oldValue?.[field])}
                                </div>
                                <div>
                                  <span className="text-muted">After:</span>{" "}
                                  {formatValue(item.newValue?.[field])}
                                </div>
                              </div>
                            ))}
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    )}
                  </div>
                );
              })}
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
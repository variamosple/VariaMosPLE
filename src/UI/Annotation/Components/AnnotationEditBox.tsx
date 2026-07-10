import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function AnnotationEditBox({
  value,
  onChange,
  onCancel,
  onSave,
}: Props) {
  return (
    <div className="annotation-edit-box">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();

          if (e.key === "Escape") {
            onCancel();
          }
        }}
      />

      <div className="annotation-edit-footer">
        <div className="annotation-edit-actions">
          <button className="annotation-edit-cancel" onClick={onCancel}>
            Cancel
          </button>

          <button
            className="annotation-edit-save"
            onClick={onSave}
            disabled={!value.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
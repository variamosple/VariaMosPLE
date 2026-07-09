import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import HistoryPanel from "./HistoryPanel";

jest.mock("react-bootstrap/Offcanvas", () => {
  const MockOffcanvas = ({ show, children }: any) =>
    show ? <div data-testid="history-offcanvas">{children}</div> : null;

  MockOffcanvas.Header = ({ children }: any) => (
    <div data-testid="offcanvas-header">{children}</div>
  );

  MockOffcanvas.Title = ({ children }: any) => (
    <div data-testid="offcanvas-title">{children}</div>
  );

  MockOffcanvas.Body = ({ children }: any) => (
    <div data-testid="offcanvas-body">{children}</div>
  );

  return MockOffcanvas;
});

jest.mock("./Components/RevertConfirmationModal", () => (props: any) =>
  props.show ? (
    <div data-testid="revert-modal">
      <button onClick={props.onConfirm}>Confirm revert</button>
      <button onClick={props.onCancel}>Cancel revert</button>
    </div>
  ) : null
);

const updateItem = {
  id: "h1",
  modelId: "model-1",
  actionType: "ITEM_UPDATED",
  entityType: "ELEMENT",
  entityId: "el-1",
  description: 'Updated element "Foo"',
  oldValue: { name: "Foo" },
  newValue: { name: "Bar" },
  createdAt: new Date().toISOString(),
  userName: "Luis",
};

const deleteItem = {
  id: "h2",
  modelId: "model-1",
  actionType: "ITEM_DELETED",
  entityType: "ELEMENT",
  entityId: "el-2",
  description: 'Deleted element "Baz"',
  oldValue: { name: "Baz" },
  newValue: null,
  createdAt: new Date().toISOString(),
  userName: "Luis",
};

describe("HistoryPanel - revert access control", () => {
  test("Revert button is visible when the user has permission", () => {
    render(
      <HistoryPanel
        show={true}
        onHide={() => {}}
        projectService={{} as any}
        historyRecords={[updateItem]}
        selectedModelId="model-1"
        onRefresh={() => {}}
        onRevertHistoryItem={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /revert/i })
    ).toBeVisible();
  });

  test("Revert button is not rendered when the user does not have permission", () => {
    render(
      <HistoryPanel
        show={true}
        onHide={() => {}}
        projectService={{} as any}
        historyRecords={[updateItem]}
        selectedModelId="model-1"
        onRefresh={() => {}}
        onRevertHistoryItem={undefined}
      />
    );

    expect(
      screen.queryByRole("button", { name: /revert/i })
    ).not.toBeInTheDocument();
  });
});

describe("HistoryPanel - revert action handling", () => {
  test("Reverting an update calls onRevertHistoryItem with the correct history record", () => {
    const onRevertHistoryItem = jest.fn();

    render(
      <HistoryPanel
        show={true}
        onHide={() => {}}
        projectService={{} as any}
        historyRecords={[updateItem]}
        selectedModelId="model-1"
        onRefresh={() => {}}
        onRevertHistoryItem={onRevertHistoryItem}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /revert/i })
    );

    fireEvent.click(
      screen.getByRole("button", { name: /confirm revert/i })
    );

    expect(onRevertHistoryItem).toHaveBeenCalledTimes(1);

    expect(onRevertHistoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "ITEM_UPDATED",
        id: "h1",
      })
    );
  });

  test("Reverting a deletion calls onRevertHistoryItem with the correct history record", () => {
    const onRevertHistoryItem = jest.fn();

    render(
      <HistoryPanel
        show={true}
        onHide={() => {}}
        projectService={{} as any}
        historyRecords={[deleteItem]}
        selectedModelId="model-1"
        onRefresh={() => {}}
        onRevertHistoryItem={onRevertHistoryItem}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /revert/i })
    );

    fireEvent.click(
      screen.getByRole("button", { name: /confirm revert/i })
    );

    expect(onRevertHistoryItem).toHaveBeenCalledTimes(1);

    expect(onRevertHistoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "ITEM_DELETED",
        id: "h2",
      })
    );
  });
});
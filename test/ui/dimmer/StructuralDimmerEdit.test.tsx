import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { DimmerStructuralChangePreview } from "../../../src/ui/components/DimmerStructuralChangePreview";
import { StructuralCommitReport } from "../../../src/protocol/hue/dimmer";

const changeSet = {
  summary: "Update the recognized dimmer behavior.",
  operations: [
    { kind: "rule" as const, id: "10", operation: "update" as const, payload: { name: "Updated" }, label: "Update dimmer Rule" },
    { kind: "rule" as const, id: "11", operation: "delete" as const, label: "Remove obsolete dimmer Rule" },
  ],
};

test("structural UI confirms the set before committing and asks separately before delete", async () => {
  const commit = jest.fn(async () => ({ kind: "success" as const }));
  const view = render(<DimmerStructuralChangePreview changeSet={changeSet} onCommit={commit} />);
  expect(commit).not.toHaveBeenCalled();
  fireEvent.press(view.getByTestId("dimmer-structural-confirm-trigger"));
  expect(view.getByText("Confirm structural change")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Confirm"));
  await waitFor(() => expect(view.getByText("Confirm Hue resource deletion")).toBeTruthy());
  expect(commit).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Confirm"));
  await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
});

test("reports succeeded, failed-or-ambiguous, and unattempted operations after commit", async () => {
  const report: StructuralCommitReport = {
    status: "stopped",
    kind: "partial_failure",
    operations: [
      { operation: changeSet.operations[0], status: "succeeded", kind: "success" },
      { operation: changeSet.operations[1], status: "failed_or_ambiguous", kind: "definite_failure", reason: "Hue rejected the update." },
    ],
    succeeded: [{ operation: changeSet.operations[0], status: "succeeded", kind: "success" }],
    failedOrAmbiguous: [{ operation: changeSet.operations[1], status: "failed_or_ambiguous", kind: "definite_failure", reason: "Hue rejected the update." }],
    unattempted: [{ operation: changeSet.operations[0], status: "unattempted", reason: "Not attempted after the structural change stopped." }],
  };
  const commit = jest.fn(async () => report);
  const view = render(<DimmerStructuralChangePreview changeSet={changeSet} onCommit={commit} />);
  fireEvent.press(view.getByTestId("dimmer-structural-confirm-trigger"));
  fireEvent.press(view.getByLabelText("Confirm"));
  await waitFor(() => expect(view.getByText("Confirm Hue resource deletion")).toBeTruthy());
  fireEvent.press(view.getByLabelText("Confirm"));
  await waitFor(() => expect(view.getByTestId("dimmer-structural-report")).toBeTruthy());
  expect(view.getByText("Succeeded (1)")).toBeTruthy();
  expect(view.getByText("Failed or ambiguous (1)")).toBeTruthy();
  expect(view.getByText("Unattempted (1)")).toBeTruthy();
  expect(view.getByText("Hue rejected the update.")).toBeTruthy();
});

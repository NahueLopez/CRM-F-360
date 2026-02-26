import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./ToastContext";

/** Helper component that triggers a toast */
const ToastTrigger = ({ type, message }: { type: "success" | "error"; message: string }) => {
    const { addToast } = useToast();
    return <button onClick={() => addToast(type, message)}>Trigger</button>;
};

describe("ToastContext", () => {
    it("renders toast when addToast is called", async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider>
                <ToastTrigger type="success" message="Proyecto creado" />
            </ToastProvider>,
        );

        await user.click(screen.getByText("Trigger"));

        expect(screen.getByText("Proyecto creado")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders error toast with correct styling", async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider>
                <ToastTrigger type="error" message="Error al guardar" />
            </ToastProvider>,
        );

        await user.click(screen.getByText("Trigger"));

        expect(screen.getByText("Error al guardar")).toBeInTheDocument();
    });

    it("dismisses toast when ✕ is clicked", async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider>
                <ToastTrigger type="success" message="Toast temporal" />
            </ToastProvider>,
        );

        await user.click(screen.getByText("Trigger"));
        expect(screen.getByText("Toast temporal")).toBeInTheDocument();

        await user.click(screen.getByText("✕"));
        expect(screen.queryByText("Toast temporal")).not.toBeInTheDocument();
    });

    it("throws error when useToast is used outside provider", () => {
        const ConsoleError = console.error;
        console.error = () => { }; // suppress React error boundary logs

        const BadComponent = () => {
            useToast();
            return null;
        };

        expect(() => render(<BadComponent />)).toThrow(
            "useToast must be used within ToastProvider",
        );

        console.error = ConsoleError;
    });
});

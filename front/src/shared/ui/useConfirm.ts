import { useState, useCallback } from "react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
    resolve: ((value: boolean) => void) | null;
}

/**
 * useConfirm – replaces window.confirm with a pretty modal.
 *
 * Usage:
 *   const { confirm, confirmProps } = useConfirm();
 *   ...
 *   if (await confirm({ message: "¿Eliminar?" })) { doDelete(); }
 *   ...
 *   <ConfirmModal {...confirmProps} />
 */
export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        message: "",
        resolve: null,
    });

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setState({ ...opts, open: true, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState(s => ({ ...s, open: false, resolve: null }));
    }, [state.resolve]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState(s => ({ ...s, open: false, resolve: null }));
    }, [state.resolve]);

    return {
        confirm,
        confirmProps: {
            open: state.open,
            title: state.title,
            message: state.message,
            confirmLabel: state.confirmLabel,
            cancelLabel: state.cancelLabel,
            variant: state.variant,
            onConfirm: handleConfirm,
            onCancel: handleCancel,
        },
    };
}

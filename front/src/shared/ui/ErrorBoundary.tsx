import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Catches unhandled errors in the React tree and shows a friendly fallback.
 * Wrap pages or sections to prevent a single broken component from
 * crashing the entire app.
 */
class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
                    <div className="text-4xl">💥</div>
                    <h2 className="text-lg font-semibold text-slate-200">
                        Algo salió mal
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md">
                        {this.state.error?.message || "Error inesperado en la aplicación."}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

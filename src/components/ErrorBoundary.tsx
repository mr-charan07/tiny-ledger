import React, { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-lg border border-border bg-card p-6 space-y-4">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The app hit a runtime error and stopped rendering. Reload the page, and if it happens again,
              it usually means the deployed contract address/ABI is not compatible.
            </p>
            {this.state.message && (
              <pre className="text-xs whitespace-pre-wrap rounded-md bg-secondary p-3 border border-border text-muted-foreground">
                {this.state.message}
              </pre>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground"
              >
                Reload
              </button>
              <span className="text-xs text-muted-foreground">If it persists, tell me which tab you clicked.</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon">⚠</div>
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              An unexpected error occurred. Please reload the page and try
              again.
            </p>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

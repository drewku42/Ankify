import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
        <div className="flex min-h-screen items-center justify-center p-8">
          <Card className="w-full max-w-md p-10 text-center">
            <div className="mb-4 text-4xl">⚠</div>
            <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="mb-6 text-[0.9375rem] text-muted-foreground">
              An unexpected error occurred. Please reload the page and try
              again.
            </p>
            <Button size="lg" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

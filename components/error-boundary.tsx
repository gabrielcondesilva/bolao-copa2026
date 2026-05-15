"use client";

import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-accent">Algo deu errado</p>
          <p className="mt-1 text-xs text-muted">{this.state.error?.message}</p>
          <button
            className="mt-3 rounded bg-white/5 px-3 py-1 text-xs text-foreground hover:bg-white/10 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

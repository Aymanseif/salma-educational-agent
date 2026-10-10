"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallbackTitle: string; fallbackBody: string };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a single safe log; no student data is logged.
    console.error("Salma app error:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            ⚠️
          </p>
          <h2 className="mt-2 font-extrabold text-rose-900">
            {this.props.fallbackTitle}
          </h2>
          <p className="mt-1 text-sm text-rose-800">{this.props.fallbackBody}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
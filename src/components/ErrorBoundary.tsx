import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F0EB] p-6">
          <div className="w-full max-w-md rounded-[32px] border border-[#E8E0D8] bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#141414]">
              Algo salió mal
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#8A8A8A]">
              Ha ocurrido un error inesperado. Tu progreso local seguirá disponible al recargar.
            </p>

            {this.state.error && (
              <div className="mb-6 rounded-[16px] border border-red-100 bg-red-50/50 p-4 text-left">
                <code className="text-xs text-red-600 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-[20px] bg-[#C8956C] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#C8956C]/20 transition-all hover:shadow-xl active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>

            <button
              onClick={() => window.location.reload()}
              className="mt-3 block w-full text-xs font-medium text-[#8A8A8A] transition-colors hover:text-[#141414]"
            >
              O recargar la página completamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

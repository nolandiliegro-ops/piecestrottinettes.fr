import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GarageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Garage Error Boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-greige flex items-center justify-center p-6">
          <div className="bg-white/80 backdrop-blur-sm border border-mineral/20 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
            {/* Studio Loader Animation */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-mineral/10 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-mineral/20 animate-pulse delay-100" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-mineral animate-spin" />
              </div>
            </div>
            
            <h2 className="font-display text-xl text-carbon mb-2">
              Chargement des données...
            </h2>
            <p className="text-carbon/60 text-sm mb-6">
              Nous préparons votre garage. Si le problème persiste, essayez de rafraîchir la page.
            </p>
            
            <Button 
              onClick={this.handleRetry}
              className="bg-mineral hover:bg-mineral/90 text-white gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </Button>
            
            {/* Technical info for dev */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GarageErrorBoundary;

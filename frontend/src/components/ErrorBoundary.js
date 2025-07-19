/**
 * Error Boundary pour capturer les erreurs React
 * Affiche une interface utilisateur de fallback en cas d'erreur
 */
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur dans un service de monitoring
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Envoyer l'erreur à un service de monitoring (Sentry, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Sauvegarder l'erreur dans le localStorage pour debug
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
      existingErrors.push(errorLog);
      // Garder seulement les 10 dernières erreurs
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('errorLog', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }
  }

  handleReset = () => {
    // Réinitialiser l'état d'erreur
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Optionnel: recharger la page si trop d'erreurs
    if (this.state.errorCount > 3) {
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { FallbackComponent } = this.props;

      // Si un composant de fallback personnalisé est fourni
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.handleReset}
          />
        );
      }

      // UI de fallback par défaut
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Icône d'erreur */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Message d'erreur */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Oops! Une erreur est survenue
              </h1>
              <p className="text-gray-600 text-center mb-6">
                Nous sommes désolés, mais quelque chose s'est mal passé. 
                Nos équipes ont été notifiées et travaillent sur le problème.
              </p>

              {/* Détails de l'erreur en mode développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6">
                  <details className="bg-gray-100 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-gray-700 flex items-center space-x-2">
                      <Bug className="w-4 h-4" />
                      <span>Détails techniques</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="bg-white rounded p-3">
                        <p className="text-sm font-mono text-red-600">
                          {this.state.error.toString()}
                        </p>
                      </div>
                      {this.state.errorInfo && (
                        <div className="bg-white rounded p-3">
                          <pre className="text-xs text-gray-600 overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Réessayer</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Recharger la page</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Retour à l'accueil</span>
                </button>
              </div>

              {/* Message d'aide */}
              <p className="text-xs text-gray-500 text-center mt-6">
                Si le problème persiste, veuillez contacter le support à{' '}
                <a
                  href="mailto:support@femmes-politique.ga"
                  className="text-blue-600 hover:underline"
                >
                  support@femmes-politique.ga
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC pour wrapper les composants avec ErrorBoundary
export const withErrorBoundary = (Component, FallbackComponent) => {
  return (props) => (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Hook pour utiliser l'ErrorBoundary de manière déclarative
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

export { ErrorBoundary };
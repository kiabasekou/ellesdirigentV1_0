/**
 * Système de notifications Toast
 * Affiche des messages temporaires à l'utilisateur
 */
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  AlertTriangle
} from 'lucide-react';

// Contexte pour les toasts
const ToastContext = createContext();

// Types de toast
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 text-green-800 border-green-200',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconClassName: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    iconClassName: 'text-yellow-600'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    iconClassName: 'text-blue-600'
  }
};

// Durées par défaut (en ms)
const TOAST_DURATION = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3500
};

// Composant Toast individuel
const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const { type = 'info', message, title, duration, actions } = toast;
  const config = TOAST_TYPES[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration === 0) return; // Toast permanent

    const startTime = Date.now();
    const totalDuration = duration || TOAST_DURATION[type];

    // Animation de la barre de progression
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(progressInterval);
      }
    }, 50);

    // Timer pour fermer le toast
    const timer = setTimeout(() => {
      handleClose();
    }, totalDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 200); // Durée de l'animation de sortie
  };

  return (
    <div
      className={`
        relative overflow-hidden border rounded-lg shadow-lg p-4 mb-3 max-w-md w-full
        transform transition-all duration-200 ease-in-out
        ${config.className}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconClassName}`} />
        </div>
        
        <div className="ml-3 flex-1 pt-0.5">
          {title && (
            <p className="text-sm font-medium mb-1">{title}</p>
          )}
          <p className="text-sm">{message}</p>
          
          {actions && actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    if (action.closeOnClick !== false) {
                      handleClose();
                    }
                  }}
                  className="text-sm font-medium hover:underline"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-500 rounded-md"
          >
            <span className="sr-only">Fermer</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Barre de progression */}
      {duration !== 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
          <div
            className="h-full bg-current opacity-30 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Container pour les toasts
export const ToastContainer = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

// Provider pour les toasts
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  let toastId = 0;

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id, update) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...update } : toast
      )
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearToasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook pour utiliser les toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// API simplifiée pour afficher des toasts
let toastInstance = null;

export const toast = {
  success: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast provider not initialized');
      return;
    }
    return toastInstance.addToast({
      type: 'success',
      message,
      ...options
    });
  },
  
  error: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast provider not initialized');
      return;
    }
    return toastInstance.addToast({
      type: 'error',
      message,
      ...options
    });
  },
  
  warning: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast provider not initialized');
      return;
    }
    return toastInstance.addToast({
      type: 'warning',
      message,
      ...options
    });
  },
  
  info: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast provider not initialized');
      return;
    }
    return toastInstance.addToast({
      type: 'info',
      message,
      ...options
    });
  },
  
  // Toast avec promesse
  promise: (promise, messages) => {
    const { pending, success, error } = messages;
    
    // Afficher le toast de chargement
    const toastId = toast.info(pending, { duration: 0 });
    
    promise
      .then((result) => {
        // Supprimer le toast de chargement
        if (toastInstance) {
          toastInstance.removeToast(toastId);
        }
        // Afficher le toast de succès
        toast.success(typeof success === 'function' ? success(result) : success);
        return result;
      })
      .catch((error) => {
        // Supprimer le toast de chargement
        if (toastInstance) {
          toastInstance.removeToast(toastId);
        }
        // Afficher le toast d'erreur
        toast.error(typeof error === 'function' ? error(error) : error);
        throw error;
      });
    
    return promise;
  },
  
  // Supprimer un toast spécifique
  dismiss: (toastId) => {
    if (!toastInstance) return;
    toastInstance.removeToast(toastId);
  },
  
  // Supprimer tous les toasts
  dismissAll: () => {
    if (!toastInstance) return;
    toastInstance.clearToasts();
  }
};

// Composant wrapper pour initialiser l'instance
export const ToastWrapper = ({ children }) => {
  const toastMethods = useToast();
  
  useEffect(() => {
    toastInstance = toastMethods;
    return () => {
      toastInstance = null;
    };
  }, [toastMethods]);
  
  return <>{children}</>;
};

// HOC pour ajouter les toasts à un composant
export const withToast = (Component) => {
  return (props) => {
    const toastMethods = useToast();
    return <Component {...props} toast={toastMethods} />;
  };
};

// Exemples d'utilisation:
/*
// Simple
toast.success('Opération réussie!');
toast.error('Une erreur est survenue');
toast.warning('Attention!');
toast.info('Information');

// Avec titre
toast.success('Message envoyé', {
  title: 'Succès!'
});

// Avec durée personnalisée (ms)
toast.info('Ce message restera 10 secondes', {
  duration: 10000
});

// Toast permanent (l'utilisateur doit le fermer)
toast.error('Erreur critique', {
  duration: 0
});

// Avec actions
toast.warning('Êtes-vous sûr?', {
  actions: [
    {
      label: 'Confirmer',
      onClick: () => console.log('Confirmé!')
    },
    {
      label: 'Annuler',
      onClick: () => console.log('Annulé!'),
      closeOnClick: false // Ne ferme pas le toast
    }
  ]
});

// Avec promesse
toast.promise(
  fetchData(),
  {
    pending: 'Chargement des données...',
    success: 'Données chargées avec succès!',
    error: (err) => `Erreur: ${err.message}`
  }
);

// Supprimer un toast
const id = toast.info('Message temporaire');
setTimeout(() => toast.dismiss(id), 1000);

// Supprimer tous les toasts
toast.dismissAll();
*/
/**
 * Écran de chargement avec animations
 * Utilisé pendant le chargement initial et les transitions
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ 
  fullScreen = true, 
  message = "Chargement...",
  showLogo = true,
  size = "large"
}) => {
  const sizeClasses = {
    small: {
      spinner: "w-8 h-8",
      logo: "w-12 h-12",
      text: "text-sm",
      container: "p-4"
    },
    medium: {
      spinner: "w-12 h-12",
      logo: "w-16 h-16",
      text: "text-base",
      container: "p-6"
    },
    large: {
      spinner: "w-16 h-16",
      logo: "w-20 h-20",
      text: "text-lg",
      container: "p-8"
    }
  };

  const classes = sizeClasses[size];

  const content = (
    <div className={`flex flex-col items-center justify-center ${classes.container}`}>
      {showLogo && (
        <div className={`${classes.logo} bg-gradient-to-br from-green-600 via-yellow-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
          <span className="text-white font-bold text-2xl">MF</span>
        </div>
      )}
      
      <div className="relative">
        <Loader2 className={`${classes.spinner} text-blue-600 animate-spin`} />
        {/* Cercle de fond */}
        <div className={`absolute inset-0 ${classes.spinner} rounded-full border-4 border-gray-200`}></div>
      </div>
      
      {message && (
        <p className={`mt-4 text-gray-600 ${classes.text} animate-pulse`}>
          {message}
        </p>
      )}
      
      {/* Indicateur de progression (optionnel) */}
      <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-loading-progress"></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Composant de squelette pour le chargement de contenu
export const Skeleton = ({ 
  className = "", 
  variant = "text",
  animation = "pulse"
}) => {
  const baseClasses = "bg-gray-200 rounded";
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: ""
  };

  const variantClasses = {
    text: "h-4 w-full",
    title: "h-8 w-3/4",
    rectangular: "h-32 w-full",
    circular: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-lg",
    card: "h-48 w-full rounded-lg"
  };

  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${animationClasses[animation]} 
        ${className}
      `}
    />
  );
};

// Composant de chargement pour les listes
export const ListSkeleton = ({ 
  count = 5, 
  className = "",
  showAvatar = false 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg">
          {showAvatar && (
            <Skeleton variant="circular" className="flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" className="w-2/3" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Composant de chargement pour les cartes
export const CardSkeleton = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <Skeleton variant="rectangular" className="mb-4" />
      <Skeleton variant="title" className="mb-2" />
      <Skeleton variant="text" className="mb-1" />
      <Skeleton variant="text" className="w-4/5 mb-4" />
      <div className="flex space-x-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
};

// Hook pour gérer l'état de chargement
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const startLoading = (message = "Chargement...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage("");
  };

  const withLoading = async (promise, message) => {
    startLoading(message);
    try {
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
};

// CSS personnalisé à ajouter dans le fichier CSS global
/*
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

@keyframes loading-progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.animate-loading-progress {
  animation: loading-progress 2s ease-in-out infinite;
}
*/

export default LoadingScreen;
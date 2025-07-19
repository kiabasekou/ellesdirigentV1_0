/**
 * Composant de route protégée avec:
 * - Vérification des permissions
 * - Redirection intelligente
 * - Chargement optimisé
 * - Gestion des états de validation
 */
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectUser, 
  selectIsValidated,
  selectSessionInfo 
} from '../redux/authSlice';

// Composant de chargement optimisé
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Chargement...</p>
    </div>
  </div>
);

// HOC pour les routes protégées
export const ProtectedRoute = ({ 
  children, 
  requireValidation = true,
  requireMentor = false,
  requireStaff = false,
  fallbackPath = '/login'
}) => {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isValidated = useSelector(selectIsValidated);
  const sessionInfo = useSelector(selectSessionInfo);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Simuler une vérification async (peut être remplacé par une vraie vérification)
    const checkAuth = async () => {
      // Vérifier si le token est toujours valide côté serveur
      // await verifyToken();
      setIsChecking(false);
    };

    if (isAuthenticated) {
      checkAuth();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated]);

  // Afficher le spinner pendant la vérification
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Vérifier l'expiration de session
  if (sessionInfo.isExpired) {
    return <Navigate to="/login" state={{ 
      from: location, 
      message: "Votre session a expiré. Veuillez vous reconnecter." 
    }} replace />;
  }

  // Vérifier le statut de validation
  if (requireValidation && user?.statut_validation !== 'validee') {
    if (user?.statut_validation === 'en_attente') {
      return <Navigate to="/en_attente" replace />;
    }
    if (user?.statut_validation === 'rejetee') {
      return <Navigate to="/rejetee" replace />;
    }
  }

  // Vérifier si mentor requis
  if (requireMentor && !user?.is_mentor) {
    return <Navigate to="/unauthorized" state={{ 
      message: "Cette section est réservée aux mentors." 
    }} replace />;
  }

  // Vérifier si staff requis
  if (requireStaff && !user?.is_staff) {
    return <Navigate to="/unauthorized" state={{ 
      message: "Cette section est réservée aux administrateurs." 
    }} replace />;
  }

  return children;
};

// Composant pour les routes publiques (rediriger si déjà connecté)
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    // Rediriger vers la page d'où l'utilisateur venait ou dashboard
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return children;
};

// HOC pour les permissions spécifiques
export const withPermission = (Component, permission) => {
  return (props) => {
    const user = useSelector(selectUser);
    const hasPermission = user?.permissions?.includes(permission);

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook personnalisé pour vérifier les permissions
export const usePermission = (permission) => {
  const user = useSelector(selectUser);
  return user?.permissions?.includes(permission) || false;
};

// Hook pour vérifier plusieurs permissions
export const usePermissions = (permissions = []) => {
  const user = useSelector(selectUser);
  
  return {
    hasAll: permissions.every(p => user?.permissions?.includes(p)),
    hasAny: permissions.some(p => user?.permissions?.includes(p)),
    missing: permissions.filter(p => !user?.permissions?.includes(p))
  };
};

// Composant de route avec chargement lazy
export const LazyProtectedRoute = ({ 
  component: Component,
  ...routeProps 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [LoadedComponent, setLoadedComponent] = useState(null);

  useEffect(() => {
    // Charger le composant de manière asynchrone
    const loadComponent = async () => {
      try {
        const module = await Component();
        setLoadedComponent(() => module.default || module);
      } catch (error) {
        console.error('Erreur chargement composant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [Component]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute {...routeProps}>
      {LoadedComponent && <LoadedComponent />}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
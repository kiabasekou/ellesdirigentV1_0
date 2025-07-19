// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/api';
import { loginSuccess, loginFailure, selectIsAuthenticated } from '../redux/authSlice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Tentative de connexion avec:', formData.username);

    try {
      const response = await authService.login(formData.username, formData.password);
      console.log('Connexion réussie!');
      
      // Dispatcher l'action Redux
      dispatch(loginSuccess(response));
      
      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      
      let errorMessage = 'Une erreur est survenue';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Données invalides';
        } else {
          errorMessage = `Erreur serveur: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
      }
      
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* AJOUT: Logo Elles Dirigent */}
          <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <img 
              src="/logo-elles-dirigent.png" 
              alt="Elles Dirigent"
              className="w-full h-full object-contain"
            />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {/* MODIFICATION: Nom de la plateforme */}
            Elles Dirigent - République Gabonaise
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Mot de passe oublié ?
              </a>
            </div>
            <div className="text-sm">
              <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Créer un compte
              </a>
            </div>
          </div>
        </form>

        {/* Section de test pour le développement */}
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600 mb-2">Pour tester :</p>
          <p className="text-xs font-mono">Username: admin</p>
          <p className="text-xs font-mono">Password: Admin123!@#</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
#!/usr/bin/env python
"""
Script de diagnostic pour problème de connexion frontend
Identifie les problèmes courants de login React/Django
"""
import requests
import json
import subprocess
import os
from colorama import init, Fore, Style

init()

# Configuration
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"
API_URL = f"{BACKEND_URL}/api"

class LoginDiagnostic:
    def __init__(self):
        self.session = requests.Session()
        self.issues = []
        
    def print_header(self, text):
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{text}")
        print(f"{'='*60}{Style.RESET_ALL}")
    
    def print_success(self, text):
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")
    
    def print_error(self, text):
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")
        self.issues.append(text)
    
    def print_warning(self, text):
        print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")
    
    def print_info(self, text):
        print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")
    
    def print_code(self, code):
        print(f"{Fore.MAGENTA}{code}{Style.RESET_ALL}")
    
    def check_backend_login(self):
        """Vérifie que le login fonctionne côté backend"""
        self.print_header("1. TEST LOGIN BACKEND DIRECT")
        
        # Test avec l'utilisateur admin
        credentials = {
            "username": "admin",
            "password": "Admin123!@#"
        }
        
        try:
            response = self.session.post(
                f"{API_URL}/token/",
                json=credentials,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                self.print_success("Login backend fonctionne correctement")
                tokens = response.json()
                self.print_info(f"Access token reçu: {tokens.get('access', '')[:20]}...")
                self.print_info(f"Refresh token reçu: {tokens.get('refresh', '')[:20]}...")
                return True
            else:
                self.print_error(f"Erreur login backend: {response.status_code}")
                self.print_error(f"Réponse: {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Exception backend: {str(e)}")
            return False
    
    def check_frontend_api_config(self):
        """Vérifie la configuration API dans le frontend"""
        self.print_header("2. VÉRIFICATION CONFIGURATION FRONTEND")
        
        # Chemins à vérifier
        frontend_path = os.path.join("..", "..", "frontend")
        
        # Vérifier .env
        env_file = os.path.join(frontend_path, ".env")
        if os.path.exists(env_file):
            self.print_success(".env trouvé")
            with open(env_file, 'r') as f:
                content = f.read()
                if "REACT_APP_API_URL" in content:
                    api_url = [line for line in content.split('\n') if 'REACT_APP_API_URL' in line]
                    self.print_info(f"Configuration: {api_url[0] if api_url else 'Non trouvée'}")
                else:
                    self.print_warning("REACT_APP_API_URL non défini dans .env")
        else:
            self.print_warning(".env non trouvé - Créez-le avec:")
            self.print_code("REACT_APP_API_URL=http://localhost:8000/api")
        
        # Vérifier la configuration axios
        api_config_paths = [
            os.path.join(frontend_path, "src", "services", "api.js"),
            os.path.join(frontend_path, "src", "utils", "api.js"),
            os.path.join(frontend_path, "src", "config", "api.js"),
            os.path.join(frontend_path, "src", "api", "index.js"),
        ]
        
        config_found = False
        for path in api_config_paths:
            if os.path.exists(path):
                self.print_success(f"Configuration API trouvée: {path}")
                config_found = True
                # Vérifier le contenu
                with open(path, 'r') as f:
                    content = f.read()
                    if "localhost:8000" in content or "REACT_APP_API_URL" in content:
                        self.print_success("URL backend correctement configurée")
                    else:
                        self.print_error("URL backend peut être mal configurée")
                break
        
        if not config_found:
            self.print_error("Fichier de configuration API non trouvé")
    
    def check_login_implementation(self):
        """Vérifie l'implémentation du login dans le frontend"""
        self.print_header("3. VÉRIFICATION CODE LOGIN FRONTEND")
        
        frontend_path = os.path.join("..", "..", "frontend", "src")
        
        # Rechercher les composants de login
        login_files = []
        for root, dirs, files in os.walk(frontend_path):
            for file in files:
                if 'login' in file.lower() and file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                    login_files.append(os.path.join(root, file))
        
        if login_files:
            self.print_success(f"Fichiers de login trouvés: {len(login_files)}")
            for file in login_files[:3]:  # Afficher max 3 fichiers
                self.print_info(f"  - {os.path.relpath(file, frontend_path)}")
        else:
            self.print_error("Aucun fichier de login trouvé")
        
        # Vérifier les problèmes courants dans le code
        self.print_info("\nVérification des erreurs courantes...")
        
        issues_to_check = {
            "credentials": "Assurez-vous d'envoyer {username, password}",
            "Content-Type": "Vérifiez que Content-Type: application/json est défini",
            "/api/token/": "L'endpoint doit être /api/token/ (avec slash final)",
            "localStorage": "Stockez les tokens dans localStorage après login",
            "catch": "Gérez les erreurs avec .catch() ou try/catch"
        }
        
        for keyword, message in issues_to_check.items():
            found = False
            for file in login_files:
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        if keyword in f.read():
                            found = True
                            break
                except:
                    pass
            
            if found:
                self.print_success(f"✓ {keyword} trouvé")
            else:
                self.print_warning(f"? {keyword} non trouvé - {message}")
    
    def test_cors_with_credentials(self):
        """Test CORS avec credentials depuis le frontend"""
        self.print_header("4. TEST CORS AVEC CREDENTIALS")
        
        headers = {
            'Origin': FRONTEND_URL,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        
        credentials = {
            "username": "admin",
            "password": "Admin123!@#"
        }
        
        try:
            response = self.session.post(
                f"{API_URL}/token/",
                json=credentials,
                headers=headers
            )
            
            # Vérifier les headers CORS dans la réponse
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            if cors_headers['Access-Control-Allow-Origin'] == FRONTEND_URL:
                self.print_success(f"CORS Origin correct: {FRONTEND_URL}")
            else:
                self.print_error(f"CORS Origin incorrect: {cors_headers['Access-Control-Allow-Origin']}")
            
            if cors_headers['Access-Control-Allow-Credentials'] == 'true':
                self.print_success("CORS Credentials autorisés")
            else:
                self.print_warning("CORS Credentials non configurés")
                
        except Exception as e:
            self.print_error(f"Erreur test CORS: {str(e)}")
    
    def check_browser_console(self):
        """Guide pour vérifier la console du navigateur"""
        self.print_header("5. VÉRIFICATION CONSOLE NAVIGATEUR")
        
        self.print_info("Ouvrez Chrome DevTools (F12) et vérifiez:")
        print("\n1. Onglet Console:")
        print("   - Erreurs CORS (Access-Control-Allow-Origin)")
        print("   - Erreurs 404 (mauvaise URL)")
        print("   - Erreurs de syntaxe JavaScript")
        
        print("\n2. Onglet Network:")
        print("   - Filtrez par 'XHR' ou 'Fetch'")
        print("   - Cherchez la requête vers /api/token/")
        print("   - Vérifiez le Status Code")
        print("   - Cliquez sur la requête pour voir:")
        print("     • Request Headers")
        print("     • Request Payload")
        print("     • Response")
        
        print("\n3. Erreurs courantes:")
        self.print_error("• CORS error → Vérifiez CORS_ALLOWED_ORIGINS dans settings.py")
        self.print_error("• 404 Not Found → Mauvaise URL d'API")
        self.print_error("• 400 Bad Request → Format des données incorrect")
        self.print_error("• Network Error → Backend non démarré")
    
    def provide_example_code(self):
        """Fournit un exemple de code de login fonctionnel"""
        self.print_header("6. EXEMPLE DE CODE LOGIN FONCTIONNEL")
        
        print("\n" + Fore.GREEN + "=== Exemple de service API (src/services/api.js) ===" + Style.RESET_ALL)
        print("""
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour CORS
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/token/', { username, password });
      const { access, refresh } = response.data;
      
      // Stocker les tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export default api;
""")
        
        print("\n" + Fore.GREEN + "=== Exemple de composant Login ===" + Style.RESET_ALL)
        print("""
import React, { useState } from 'react';
import { authService } from '../services/api';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(credentials.username, credentials.password);
      console.log('Login successful!');
      // Rediriger vers le dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        placeholder="Nom d'utilisateur"
        value={credentials.username}
        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
        required
      />
      
      <input
        type="password"
        placeholder="Mot de passe"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
""")
    
    def generate_fix_checklist(self):
        """Génère une checklist de corrections"""
        self.print_header("7. CHECKLIST DE RÉSOLUTION")
        
        print("\n" + Fore.YELLOW + "Vérifiez dans l'ordre :" + Style.RESET_ALL)
        
        checklist = [
            "Backend démarré sur http://localhost:8000",
            "Frontend démarré sur http://localhost:3000",
            "Fichier .env créé avec REACT_APP_API_URL=http://localhost:8000/api",
            "Redémarrer le frontend après modification du .env (npm start)",
            "URL de l'API correcte dans le code (/api/token/ avec slash final)",
            "Format des données : {username: 'xxx', password: 'yyy'}",
            "Headers Content-Type: application/json",
            "CORS_ALLOWED_ORIGINS contient http://localhost:3000 dans settings.py",
            "Pas d'erreur dans la console du navigateur",
            "Tokens stockés dans localStorage après login réussi"
        ]
        
        for i, item in enumerate(checklist, 1):
            print(f"\n{i}. [ ] {item}")
        
        if self.issues:
            print(f"\n{Fore.RED}Problèmes détectés :{Style.RESET_ALL}")
            for issue in self.issues:
                print(f"  - {issue}")


def main():
    print(f"{Fore.BLUE}🔍 DIAGNOSTIC PROBLÈME LOGIN FRONTEND{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    
    diagnostic = LoginDiagnostic()
    
    # Exécuter les tests
    diagnostic.check_backend_login()
    diagnostic.check_frontend_api_config()
    diagnostic.check_login_implementation()
    diagnostic.test_cors_with_credentials()
    diagnostic.check_browser_console()
    diagnostic.provide_example_code()
    diagnostic.generate_fix_checklist()
    
    print(f"\n{Fore.BLUE}🏁 Diagnostic terminé{Style.RESET_ALL}")
    
    if not diagnostic.issues:
        print(f"\n{Fore.GREEN}✅ Aucun problème critique détecté côté backend{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Le problème est probablement dans le code React.{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}❌ {len(diagnostic.issues)} problème(s) détecté(s){Style.RESET_ALL}")


if __name__ == '__main__':
    main()
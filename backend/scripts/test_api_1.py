#!/usr/bin/env python
"""
Script de test de l'API pour vérifier la communication frontend-backend
Teste tous les endpoints critiques
"""
import requests
import json
import time
import random
from datetime import datetime
from colorama import init, Fore, Style

# Initialiser colorama pour les couleurs dans le terminal
init()

# Configuration
API_BASE_URL = "http://localhost:8000/api"

# Utilisateur de test avec mot de passe conforme
TEST_USER = {
    "username": "test.user.2025",
    "email": "test2025@example.com",
    # Remplacez la ligne du mot de passe par :
    "password": "UltraS3cur3!Pass#2025$Wom3n",
    "password_confirm": "UltraS3cur3!Pass#2025$Wom3n",
    "first_name": "Test",
    "last_name": "User",
    "nip": f"TEST{random.randint(10000000, 99999999)}",
    "phone": f"+241{random.randint(60000000, 77999999)}",
    "region": "estuaire",
    "ville": "Libreville",
    "experience": "locale",
    "accept_terms": True
}

# Utilisateur existant pour tester la connexion
EXISTING_USER = {
    "username": "admin",
    "password": "Admin123!@#"
}


class APITester:
    """Classe pour tester les endpoints de l'API"""
    
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.results = []
    
    def print_header(self, text):
        """Affiche un en-tête formaté"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{text}")
        print(f"{'='*60}{Style.RESET_ALL}")
    
    def print_success(self, text):
        """Affiche un message de succès"""
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")
    
    def print_error(self, text):
        """Affiche un message d'erreur"""
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")
    
    def print_info(self, text):
        """Affiche une information"""
        print(f"{Fore.YELLOW}ℹ️  {text}{Style.RESET_ALL}")
    
    def test_endpoint(self, method, endpoint, data=None, files=None, auth=False, description=""):
        """Teste un endpoint et retourne le résultat"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if auth and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = self.session.post(url, data=data, files=files, headers=headers)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = self.session.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                headers['Content-Type'] = 'application/json'
                response = self.session.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Méthode non supportée: {method}")
            
            duration = (time.time() - start_time) * 1000  # En millisecondes
            
            result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': response.status_code,
                'duration': duration,
                'success': 200 <= response.status_code < 300,
                'description': description
            }
            
            self.results.append(result)
            
            if result['success']:
                self.print_success(f"{method} {endpoint} - {response.status_code} ({duration:.0f}ms)")
                if description:
                    self.print_info(f"   {description}")
            else:
                self.print_error(f"{method} {endpoint} - {response.status_code} ({duration:.0f}ms)")
                if response.text:
                    error_text = response.text[:300] + "..." if len(response.text) > 300 else response.text
                    self.print_error(f"   Erreur: {error_text}")
            
            return response
            
        except Exception as e:
            self.print_error(f"{method} {endpoint} - Erreur: {str(e)}")
            self.results.append({
                'endpoint': endpoint,
                'method': method,
                'status_code': 0,
                'duration': 0,
                'success': False,
                'error': str(e),
                'description': description
            })
            return None
    
    def test_health_check(self):
        """Test de santé de l'API"""
        self.print_header("TEST DE SANTÉ DE L'API")
        
        # Test de l'endpoint health
        response = self.test_endpoint('GET', '/health/', description="Vérification que l'API répond")
        
        # Test de la racine API
        response = self.test_endpoint('GET', '/', description="Test de la racine de l'API")
    
    def test_registration(self):
        """Test de l'inscription d'un utilisateur"""
        self.print_header("TEST D'INSCRIPTION")
        
        # Créer un fichier fictif pour le document
        files = {
            'document_justificatif': ('test_doc.pdf', b'%PDF-1.4 Contenu de test PDF', 'application/pdf')
        }
        
        # Préparer les données
        data = TEST_USER.copy()
        
        response = self.test_endpoint(
            'POST', 
            '/register/', 
            data=data, 
            files=files,
            description="Inscription d'un nouvel utilisateur"
        )
        
        if response and response.status_code == 201:
            try:
                data = response.json()
                if 'user' in data:
                    self.user_id = data['user'].get('id')
                    self.print_info(f"   Utilisateur créé: {data['user'].get('username')}")
                if 'tokens' in data:
                    self.access_token = data['tokens'].get('access')
                    self.refresh_token = data['tokens'].get('refresh')
                    self.print_info("   Tokens JWT reçus")
            except json.JSONDecodeError:
                self.print_error("   Réponse non-JSON reçue")
    
    def test_login_existing_user(self):
        """Test de connexion avec un utilisateur existant"""
        self.print_header("TEST DE CONNEXION (UTILISATEUR EXISTANT)")
        
        login_data = {
            'username': EXISTING_USER['username'],
            'password': EXISTING_USER['password']
        }
        
        response = self.test_endpoint(
            'POST',
            '/token/',
            data=login_data,
            description="Connexion avec admin existant"
        )
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                self.print_info("   Tokens JWT reçus et stockés")
            except json.JSONDecodeError:
                self.print_error("   Réponse non-JSON reçue")
    
    def test_login_new_user(self):
        """Test de connexion avec le nouvel utilisateur"""
        self.print_header("TEST DE CONNEXION (NOUVEL UTILISATEUR)")
        
        login_data = {
            'username': TEST_USER['username'],
            'password': TEST_USER['password']
        }
        
        response = self.test_endpoint(
            'POST',
            '/token/',
            data=login_data,
            description="Connexion avec le nouvel utilisateur"
        )
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                self.print_info("   Tokens JWT reçus pour le nouvel utilisateur")
            except json.JSONDecodeError:
                self.print_error("   Réponse non-JSON reçue")
    
    def test_authenticated_endpoints(self):
        """Test des endpoints nécessitant authentification"""
        self.print_header("TEST DES ENDPOINTS AUTHENTIFIÉS")
        
        if not self.access_token:
            self.print_error("Pas de token d'accès disponible. Connexion requise.")
            return
        
        # Profile utilisateur
        self.test_endpoint(
            'GET',
            '/profile/',
            auth=True,
            description="Récupération du profil utilisateur"
        )
        
        # Liste des utilisateurs
        self.test_endpoint(
            'GET',
            '/users/',
            auth=True,
            description="Liste des utilisateurs (avec pagination)"
        )
        
        # Mon profil
        self.test_endpoint(
            'GET',
            '/users/me/',
            auth=True,
            description="Mon profil utilisateur"
        )
        
        # Statistiques
        self.test_endpoint(
            'GET',
            '/users/statistics/',
            auth=True,
            description="Récupération des statistiques plateforme"
        )
        
        # Activité utilisateur
        self.test_endpoint(
            'POST',
            '/users/activity/',
            auth=True,
            description="Mise à jour de l'activité utilisateur"
        )
    
    def test_refresh_token(self):
        """Test du rafraichissement du token"""
        self.print_header("TEST DE RAFRAÎCHISSEMENT DU TOKEN")
        
        if not self.refresh_token:
            self.print_error("Pas de refresh token disponible")
            return
        
        response = self.test_endpoint(
            'POST',
            '/token/refresh/',
            data={'refresh': self.refresh_token},
            description="Rafraîchissement du token d'accès"
        )
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.access_token = data.get('access')
                self.print_info("   Nouveau token d'accès reçu")
            except json.JSONDecodeError:
                self.print_error("   Réponse non-JSON reçue")
    
    def test_error_handling(self):
        """Test de la gestion des erreurs"""
        self.print_header("TEST DE GESTION DES ERREURS")
        
        # Endpoint inexistant
        self.test_endpoint(
            'GET',
            '/endpoint-inexistant/',
            description="Test 404 - Endpoint inexistant"
        )
        
        # Authentification requise sans token
        old_token = self.access_token
        self.access_token = None
        self.test_endpoint(
            'GET',
            '/profile/',
            auth=True,
            description="Test 401 - Authentification requise"
        )
        self.access_token = old_token
        
        # Données invalides pour l'inscription
        self.test_endpoint(
            'POST',
            '/register/',
            data={'username': 'x'},  # Données incomplètes
            description="Test 400 - Données invalides"
        )
        
        # Token invalide
        if old_token:
            self.access_token = "token-invalide"
            self.test_endpoint(
                'GET',
                '/profile/',
                auth=True,
                description="Test 401 - Token invalide"
            )
            self.access_token = old_token
    
    def test_cors(self):
        """Test des headers CORS"""
        self.print_header("TEST CORS")
        
        # Requête OPTIONS pour vérifier CORS
        url = f"{self.base_url}/token/"
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
        
        try:
            response = self.session.options(url, headers=headers)
            
            if 'Access-Control-Allow-Origin' in response.headers:
                self.print_success("CORS configuré correctement")
                self.print_info(f"   Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
                self.print_info(f"   Allow-Methods: {response.headers.get('Access-Control-Allow-Methods')}")
            else:
                self.print_error("Headers CORS non trouvés")
                
        except Exception as e:
            self.print_error(f"Erreur test CORS: {str(e)}")
    
    def print_summary(self):
        """Affiche un résumé des tests"""
        self.print_header("RÉSUMÉ DES TESTS")
        
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - successful_tests
        
        print(f"\n{Fore.CYAN}Total des tests: {total_tests}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}Réussis: {successful_tests}{Style.RESET_ALL}")
        print(f"{Fore.RED}Échoués: {failed_tests}{Style.RESET_ALL}")
        
        if successful_tests > 0:
            success_rate = (successful_tests / total_tests) * 100
            print(f"{Fore.CYAN}Taux de réussite: {success_rate:.1f}%{Style.RESET_ALL}")
        
        if failed_tests > 0:
            print(f"\n{Fore.RED}Tests échoués:{Style.RESET_ALL}")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['method']} {result['endpoint']} ({result['status_code']})")
                    if result.get('error'):
                        print(f"    Erreur: {result['error']}")
        
        # Statistiques de performance
        durations = [r['duration'] for r in self.results if r['success'] and r['duration'] > 0]
        if durations:
            avg_duration = sum(durations) / len(durations)
            print(f"\n{Fore.CYAN}Performance:{Style.RESET_ALL}")
            print(f"  Temps moyen de réponse: {avg_duration:.0f}ms")
            print(f"  Temps min: {min(durations):.0f}ms")
            print(f"  Temps max: {max(durations):.0f}ms")


def main():
    """Fonction principale"""
    print(f"{Fore.BLUE}🧪 TEST DE L'API - PLATEFORME FEMMES EN POLITIQUE{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    print(f"URL de l'API: {API_BASE_URL}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Vérifier que le serveur est accessible
    try:
        response = requests.get(API_BASE_URL, timeout=5)
        print(f"\n{Fore.GREEN}✅ Serveur accessible{Style.RESET_ALL}")
    except requests.exceptions.ConnectionError:
        print(f"\n{Fore.RED}❌ Erreur: Le serveur n'est pas accessible à {API_BASE_URL}")
        print(f"   Assurez-vous que le serveur Django est démarré (python manage.py runserver){Style.RESET_ALL}")
        return
    except Exception as e:
        print(f"\n{Fore.RED}❌ Erreur: {str(e)}{Style.RESET_ALL}")
        return
    
    # Créer le testeur
    tester = APITester(API_BASE_URL)
    
    # Exécuter les tests
    tester.test_health_check()
    tester.test_login_existing_user()  # Tester avec l'admin existant d'abord
    tester.test_registration()
    tester.test_login_new_user()       # Puis avec le nouvel utilisateur
    tester.test_authenticated_endpoints()
    tester.test_refresh_token()
    tester.test_error_handling()
    tester.test_cors()
    
    # Afficher le résumé
    tester.print_summary()
    
    print(f"\n{Fore.BLUE}🏁 Tests terminés{Style.RESET_ALL}")


if __name__ == '__main__':
    main()
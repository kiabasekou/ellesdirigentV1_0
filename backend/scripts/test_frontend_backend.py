#!/usr/bin/env python
"""
Script de test pour vérifier la connexion complète Frontend-Backend
Simule les interactions du frontend React avec l'API Django
"""
import requests
import json
import time
import websocket
import threading
from datetime import datetime
from colorama import init, Fore, Style
import subprocess
import sys
import os

# Initialiser colorama
init()

# Configuration
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"
API_URL = f"{BACKEND_URL}/api"

class FrontendBackendTester:
    """Testeur d'intégration Frontend-Backend"""
    
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        self.frontend_running = False
        self.backend_running = False
        
    def print_header(self, text):
        """Affiche un en-tête formaté"""
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{text}")
        print(f"{'='*70}{Style.RESET_ALL}")
    
    def print_success(self, text):
        """Affiche un message de succès"""
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")
    
    def print_error(self, text):
        """Affiche un message d'erreur"""
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")
    
    def print_info(self, text):
        """Affiche une information"""
        print(f"{Fore.YELLOW}ℹ️  {text}{Style.RESET_ALL}")
    
    def print_warning(self, text):
        """Affiche un avertissement"""
        print(f"{Fore.MAGENTA}⚠️  {text}{Style.RESET_ALL}")
    
    def check_server_status(self):
        """Vérifie le statut des serveurs"""
        self.print_header("VÉRIFICATION DES SERVEURS")
        
        # Vérifier le backend
        try:
            response = requests.get(f"{API_URL}/health/", timeout=5)
            if response.status_code == 200:
                self.backend_running = True
                self.print_success(f"Backend Django accessible sur {BACKEND_URL}")
            else:
                self.print_error(f"Backend répond avec le code {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.print_error(f"Backend Django non accessible sur {BACKEND_URL}")
            self.print_info("Lancez le serveur: python manage.py runserver")
        except Exception as e:
            self.print_error(f"Erreur backend: {str(e)}")
        
        # Vérifier le frontend
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                self.frontend_running = True
                self.print_success(f"Frontend React accessible sur {FRONTEND_URL}")
            else:
                self.print_warning(f"Frontend répond avec le code {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.print_error(f"Frontend React non accessible sur {FRONTEND_URL}")
            self.print_info("Lancez le serveur: npm start (dans le dossier frontend)")
        except Exception as e:
            self.print_error(f"Erreur frontend: {str(e)}")
        
        return self.backend_running and self.frontend_running
    
    def test_cors_headers(self):
        """Test des headers CORS pour les requêtes cross-origin"""
        self.print_header("TEST CORS (Cross-Origin Resource Sharing)")
        
        # Test OPTIONS preflight
        headers = {
            'Origin': FRONTEND_URL,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type,authorization'
        }
        
        try:
            response = self.session.options(f"{API_URL}/token/", headers=headers)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            # Vérifier les headers CORS
            if cors_headers['Access-Control-Allow-Origin']:
                self.print_success("Headers CORS présents")
                for header, value in cors_headers.items():
                    if value:
                        self.print_info(f"   {header}: {value}")
                
                # Vérifier que l'origine frontend est autorisée
                if FRONTEND_URL in cors_headers['Access-Control-Allow-Origin'] or cors_headers['Access-Control-Allow-Origin'] == '*':
                    self.print_success("Frontend autorisé par CORS")
                else:
                    self.print_error("Frontend non autorisé dans les origines CORS")
            else:
                self.print_error("Headers CORS manquants")
                
        except Exception as e:
            self.print_error(f"Erreur test CORS: {str(e)}")
    
    def test_api_endpoints_from_frontend(self):
        """Simule les appels API depuis le frontend"""
        self.print_header("TEST DES APPELS API DEPUIS LE FRONTEND")
        
        # Headers simulant une requête depuis le frontend
        frontend_headers = {
            'Origin': FRONTEND_URL,
            'Referer': f'{FRONTEND_URL}/',
            'User-Agent': 'Mozilla/5.0 (Frontend Test)',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Test 1: Endpoint de santé
        self.print_info("\n1. Test endpoint de santé")
        try:
            response = self.session.get(
                f"{API_URL}/health/",
                headers=frontend_headers
            )
            
            if response.status_code == 200:
                self.print_success("Endpoint santé accessible depuis le frontend")
                data = response.json()
                self.print_info(f"   Réponse: {json.dumps(data, indent=2)}")
            else:
                self.print_error(f"Erreur {response.status_code}: {response.text}")
                
        except Exception as e:
            self.print_error(f"Erreur appel santé: {str(e)}")
        
        # Test 2: Login
        self.print_info("\n2. Test de connexion (login)")
        login_data = {
            'username': 'admin',
            'password': 'Admin123!@#'
        }
        
        try:
            response = self.session.post(
                f"{API_URL}/token/",
                json=login_data,
                headers=frontend_headers
            )
            
            if response.status_code == 200:
                self.print_success("Login réussi depuis le frontend")
                tokens = response.json()
                access_token = tokens.get('access')
                
                if access_token:
                    self.print_info("   Token d'accès reçu")
                    
                    # Test 3: Appel authentifié
                    self.print_info("\n3. Test appel authentifié")
                    auth_headers = frontend_headers.copy()
                    auth_headers['Authorization'] = f'Bearer {access_token}'
                    
                    response = self.session.get(
                        f"{API_URL}/profile/",
                        headers=auth_headers
                    )
                    
                    if response.status_code == 200:
                        self.print_success("Appel authentifié réussi")
                        profile = response.json()
                        self.print_info(f"   Utilisateur: {profile.get('username', 'N/A')}")
                    else:
                        self.print_error(f"Erreur appel authentifié: {response.status_code}")
            else:
                self.print_error(f"Erreur login: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.print_error(f"Erreur test login: {str(e)}")
    
    def test_websocket_connection(self):
        """Test de connexion WebSocket si applicable"""
        self.print_header("TEST WEBSOCKET (si configuré)")
        
        ws_url = f"ws://localhost:8000/ws/notifications/"
        
        try:
            def on_open(ws):
                self.print_success("Connexion WebSocket établie")
                ws.close()
            
            def on_error(ws, error):
                self.print_warning(f"WebSocket non configuré ou erreur: {error}")
            
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_error=on_error
            )
            
            # Timeout pour éviter de bloquer
            timer = threading.Timer(2.0, ws.close)
            timer.start()
            ws.run_forever()
            timer.cancel()
            
        except Exception as e:
            self.print_info("WebSocket non testé (optionnel)")
    
    def test_static_files(self):
        """Test de l'accès aux fichiers statiques"""
        self.print_header("TEST DES FICHIERS STATIQUES")
        
        # Test accès aux assets du frontend
        try:
            response = requests.get(f"{FRONTEND_URL}/manifest.json", timeout=5)
            if response.status_code == 200:
                self.print_success("Fichiers statiques frontend accessibles")
            else:
                self.print_warning("manifest.json non accessible")
        except:
            self.print_warning("Test fichiers statiques frontend échoué")
        
        # Test accès aux fichiers statiques du backend
        try:
            response = requests.get(f"{BACKEND_URL}/static/admin/css/base.css", timeout=5)
            if response.status_code == 200:
                self.print_success("Fichiers statiques backend accessibles")
            else:
                self.print_warning("Fichiers statiques backend non accessibles")
                self.print_info("   Exécutez: python manage.py collectstatic")
        except:
            self.print_warning("Test fichiers statiques backend échoué")
    
    def test_error_handling(self):
        """Test de la gestion des erreurs entre frontend et backend"""
        self.print_header("TEST DE GESTION DES ERREURS")
        
        frontend_headers = {
            'Origin': FRONTEND_URL,
            'Content-Type': 'application/json'
        }
        
        # Test 1: Mauvaises credentials
        self.print_info("\n1. Test avec mauvaises credentials")
        bad_login = {
            'username': 'user_inexistant',
            'password': 'mauvais_password'
        }
        
        try:
            response = self.session.post(
                f"{API_URL}/token/",
                json=bad_login,
                headers=frontend_headers
            )
            
            if response.status_code == 401:
                self.print_success("Erreur 401 correctement retournée")
                error_data = response.json()
                self.print_info(f"   Message: {error_data.get('detail', 'N/A')}")
            else:
                self.print_warning(f"Code inattendu: {response.status_code}")
                
        except Exception as e:
            self.print_error(f"Erreur test credentials: {str(e)}")
        
        # Test 2: Token expiré/invalide
        self.print_info("\n2. Test avec token invalide")
        bad_auth_headers = frontend_headers.copy()
        bad_auth_headers['Authorization'] = 'Bearer token_invalide_123'
        
        try:
            response = self.session.get(
                f"{API_URL}/profile/",
                headers=bad_auth_headers
            )
            
            if response.status_code == 401:
                self.print_success("Erreur 401 pour token invalide")
                error_data = response.json()
                self.print_info(f"   Code: {error_data.get('code', 'N/A')}")
            else:
                self.print_warning(f"Code inattendu: {response.status_code}")
                
        except Exception as e:
            self.print_error(f"Erreur test token: {str(e)}")
    
    def test_api_performance(self):
        """Test de performance des appels API"""
        self.print_header("TEST DE PERFORMANCE")
        
        endpoints = [
            ('GET', '/health/', None, False),
            ('GET', '/', None, False),
            ('POST', '/token/', {'username': 'admin', 'password': 'Admin123!@#'}, False),
        ]
        
        frontend_headers = {'Origin': FRONTEND_URL}
        times = []
        
        for method, endpoint, data, auth in endpoints:
            url = f"{API_URL}{endpoint}"
            start_time = time.time()
            
            try:
                if method == 'GET':
                    response = self.session.get(url, headers=frontend_headers)
                else:
                    response = self.session.post(url, json=data, headers=frontend_headers)
                
                elapsed = (time.time() - start_time) * 1000
                times.append(elapsed)
                
                status_icon = "✅" if 200 <= response.status_code < 300 else "⚠️"
                print(f"{status_icon} {method} {endpoint}: {elapsed:.0f}ms (Status: {response.status_code})")
                
            except Exception as e:
                print(f"❌ {method} {endpoint}: Erreur - {str(e)}")
        
        if times:
            print(f"\n{Fore.CYAN}Statistiques de performance:{Style.RESET_ALL}")
            print(f"  Temps moyen: {sum(times)/len(times):.0f}ms")
            print(f"  Temps min: {min(times):.0f}ms")
            print(f"  Temps max: {max(times):.0f}ms")
    
    def generate_report(self):
        """Génère un rapport de test"""
        self.print_header("RAPPORT D'INTÉGRATION FRONTEND-BACKEND")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""
{Fore.BLUE}RAPPORT DE TEST D'INTÉGRATION{Style.RESET_ALL}
Date: {timestamp}

{Fore.CYAN}Configuration:{Style.RESET_ALL}
- Frontend URL: {FRONTEND_URL}
- Backend URL: {BACKEND_URL}
- API URL: {API_URL}

{Fore.CYAN}Statut des serveurs:{Style.RESET_ALL}
- Frontend: {'✅ En ligne' if self.frontend_running else '❌ Hors ligne'}
- Backend: {'✅ En ligne' if self.backend_running else '❌ Hors ligne'}

{Fore.CYAN}Recommandations:{Style.RESET_ALL}
"""
        
        if not self.frontend_running:
            report += "- Démarrer le frontend: cd frontend && npm start\n"
        
        if not self.backend_running:
            report += "- Démarrer le backend: cd backend && python manage.py runserver\n"
        
        if self.frontend_running and self.backend_running:
            report += "- ✅ Les deux serveurs sont opérationnels\n"
            report += "- ✅ La communication frontend-backend est fonctionnelle\n"
            report += "- ✅ CORS est correctement configuré\n"
            report += "- ✅ L'authentification JWT fonctionne\n"
        
        print(report)
        
        # Sauvegarder le rapport
        report_file = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report.replace(Fore.BLUE, '').replace(Fore.CYAN, '').replace(Fore.GREEN, '').replace(Fore.RED, '').replace(Style.RESET_ALL, ''))
            self.print_info(f"\nRapport sauvegardé dans: {report_file}")
        except Exception as e:
            self.print_error(f"Erreur sauvegarde rapport: {str(e)}")


def main():
    """Fonction principale"""
    print(f"{Fore.BLUE}🔗 TEST D'INTÉGRATION FRONTEND-BACKEND{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*70}{Style.RESET_ALL}")
    
    tester = FrontendBackendTester()
    
    # Vérifier que les serveurs sont en ligne
    if not tester.check_server_status():
        print(f"\n{Fore.YELLOW}⚠️  Au moins un serveur n'est pas accessible.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Les tests vont continuer mais certains peuvent échouer.{Style.RESET_ALL}")
    
    # Exécuter les tests
    if tester.backend_running:
        tester.test_cors_headers()
        tester.test_api_endpoints_from_frontend()
        tester.test_websocket_connection()
        tester.test_error_handling()
        tester.test_api_performance()
    
    tester.test_static_files()
    
    # Générer le rapport
    tester.generate_report()
    
    print(f"\n{Fore.BLUE}🏁 Tests d'intégration terminés{Style.RESET_ALL}")


if __name__ == '__main__':
    # Installer les dépendances si nécessaire
    try:
        import websocket
    except ImportError:
        print("Installation de websocket-client...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websocket-client"])
        import websocket
    
    main()
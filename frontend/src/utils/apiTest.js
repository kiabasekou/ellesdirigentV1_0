/**
 * Utilitaire de test pour vérifier la communication avec l'API
 * Peut être exécuté depuis la console du navigateur
 */

class APITest {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.accessToken = null;
    this.refreshToken = null;
    this.testResults = [];
  }

  // Couleurs pour la console
  colors = {
    success: 'color: #10b981; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    info: 'color: #3b82f6; font-weight: bold;',
    warning: 'color: #f59e0b; font-weight: bold;'
  };

  log(message, type = 'info') {
    console.log(`%c${message}`, this.colors[type]);
  }

  async testEndpoint(method, endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const startTime = performance.now();
    
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      if (this.accessToken && options.auth) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const duration = performance.now() - startTime;
      
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // La réponse n'est pas du JSON
      }

      const result = {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        duration: Math.round(duration),
        data
      };

      this.testResults.push(result);

      if (response.ok) {
        this.log(`✅ ${method} ${endpoint} - ${response.status} (${result.duration}ms)`, 'success');
      } else {
        this.log(`❌ ${method} ${endpoint} - ${response.status} (${result.duration}ms)`, 'error');
        if (data) {
          console.error('Error:', data);
        }
      }

      return { response, data };
    } catch (error) {
      this.log(`❌ ${method} ${endpoint} - Network Error: ${error.message}`, 'error');
      this.testResults.push({
        endpoint,
        method,
        status: 0,
        success: false,
        error: error.message
      });
      return { error };
    }
  }

  async runAllTests() {
    console.clear();
    this.log('🧪 TESTS API - PLATEFORME FEMMES EN POLITIQUE', 'info');
    this.log('=' .repeat(50), 'info');
    
    // Test de connexion
    await this.testConnection();
    
    // Test d'inscription
    await this.testRegistration();
    
    // Test de login
    await this.testLogin();
    
    // Test des endpoints authentifiés
    await this.testAuthenticatedEndpoints();
    
    // Test de refresh token
    await this.testRefreshToken();
    
    // Test CORS
    await this.testCORS();
    
    // Résumé
    this.printSummary();
  }

  async testConnection() {
    this.log('\n📡 TEST DE CONNEXION', 'info');
    this.log('-'.repeat(30), 'info');
    
    const { response, error } = await this.testEndpoint('GET', '/');
    
    if (error) {
      this.log('Le serveur backend n\'est pas accessible!', 'error');
      this.log('Vérifiez que le serveur Django est démarré sur ' + this.baseURL, 'warning');
      return false;
    }
    
    return true;
  }

  async testRegistration() {
    this.log('\n📝 TEST D\'INSCRIPTION', 'info');
    this.log('-'.repeat(30), 'info');
    
    const userData = {
      username: `test.user.${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      password_confirm: 'Test123!@#',
      first_name: 'Test',
      last_name: 'User',
      nip: `TEST${Date.now()}`.slice(0, 12),
      region: 'estuaire',
      ville: 'Libreville',
      experience: 'locale',
      accept_terms: true
    };

    // Note: Pour un vrai test avec fichier, il faudrait utiliser FormData
    this.log('⚠️  Test d\'inscription sans fichier (limité)', 'warning');
    
    const { data } = await this.testEndpoint('POST', '/register/', {
      body: userData
    });
    
    if (data && data.tokens) {
      this.accessToken = data.tokens.access;
      this.refreshToken = data.tokens.refresh;
      this.log('Tokens reçus et stockés', 'success');
    }
  }

  async testLogin() {
    this.log('\n🔐 TEST DE CONNEXION', 'info');
    this.log('-'.repeat(30), 'info');
    
    // Utiliser les credentials du superuser créé par le script
    const loginData = {
      username: 'admin',
      password: 'Admin123!@#'
    };

    const { data } = await this.testEndpoint('POST', '/token/', {
      body: loginData
    });
    
    if (data && data.access) {
      this.accessToken = data.access;
      this.refreshToken = data.refresh;
      this.log('Connexion réussie! Tokens stockés', 'success');
      
      // Décoder le token pour voir son contenu
      try {
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (e) {
        console.error('Impossible de décoder le token');
      }
    }
  }

  async testAuthenticatedEndpoints() {
    this.log('\n🔒 TEST DES ENDPOINTS AUTHENTIFIÉS', 'info');
    this.log('-'.repeat(30), 'info');
    
    if (!this.accessToken) {
      this.log('Pas de token disponible, authentification requise', 'error');
      return;
    }

    // Test profil utilisateur
    await this.testEndpoint('GET', '/profile/', { auth: true });
    
    // Test liste des utilisateurs
    await this.testEndpoint('GET', '/users/', { auth: true });
    
    // Test mise à jour du profil
    await this.testEndpoint('PATCH', '/users/me/', {
      auth: true,
      body: {
        phone: '+241 60 00 00 00'
      }
    });
    
    // Test activité
    await this.testEndpoint('POST', '/users/activity/', { auth: true });
    
    // Test statistiques
    await this.testEndpoint('GET', '/users/statistics/', { auth: true });
  }

  async testRefreshToken() {
    this.log('\n🔄 TEST REFRESH TOKEN', 'info');
    this.log('-'.repeat(30), 'info');
    
    if (!this.refreshToken) {
      this.log('Pas de refresh token disponible', 'error');
      return;
    }

    const { data } = await this.testEndpoint('POST', '/token/refresh/', {
      body: { refresh: this.refreshToken }
    });
    
    if (data && data.access) {
      this.accessToken = data.access;
      this.log('Nouveau token obtenu avec succès', 'success');
    }
  }

  async testCORS() {
    this.log('\n🌐 TEST CORS', 'info');
    this.log('-'.repeat(30), 'info');
    
    try {
      const response = await fetch(`${this.baseURL}/api/token/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type'
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      console.log('CORS Headers:', corsHeaders);
      
      if (corsHeaders['Access-Control-Allow-Origin']) {
        this.log('CORS configuré correctement', 'success');
      } else {
        this.log('Headers CORS manquants', 'error');
      }
    } catch (error) {
      this.log('Erreur test CORS: ' + error.message, 'error');
    }
  }

  printSummary() {
    this.log('\n📊 RÉSUMÉ DES TESTS', 'info');
    this.log('='.repeat(50), 'info');
    
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.success).length;
    const failed = total - successful;
    
    this.log(`Total: ${total} tests`, 'info');
    this.log(`✅ Réussis: ${successful}`, 'success');
    this.log(`❌ Échoués: ${failed}`, 'error');
    
    if (failed > 0) {
      this.log('\nTests échoués:', 'error');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.method} ${r.endpoint} (${r.status || 'Network Error'})`);
        });
    }
    
    // Performance
    const durations = this.testResults
      .filter(r => r.duration)
      .map(r => r.duration);
    
    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      this.log('\n⚡ Performance:', 'info');
      this.log(`Temps moyen: ${Math.round(avg)}ms`, 'info');
      this.log(`Min: ${Math.min(...durations)}ms | Max: ${Math.max(...durations)}ms`, 'info');
    }
  }
}

// Fonction utilitaire pour lancer les tests depuis la console
window.testAPI = async function(baseURL = 'http://localhost:8000') {
  const tester = new APITest(baseURL);
  await tester.runAllTests();
  return tester;
};

// Instructions
console.log('%c🧪 Test API disponible!', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%cPour lancer les tests, exécutez: testAPI()', 'color: #3b82f6; font-size: 14px;');
console.log('%cOu avec une URL personnalisée: testAPI("http://localhost:8000")', 'color: #3b82f6; font-size: 14px;');

export default APITest;
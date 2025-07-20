const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class TrainingService {
  async getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Formations pour participantes
  async getFormations(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/training/formations/?${params}`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des formations');
    }
    
    return response.json();
  }

  async getFormation(id) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${id}/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Formation non trouvée');
    }
    
    return response.json();
  }

  async inscrireFormation(formationId) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${formationId}/inscrire/`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }
    
    return response.json();
  }

  async desinscrireFormation(formationId) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${formationId}/desinscrire/`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la désinscription');
    }
    
    return response.json();
  }

  async getMesFormations() {
    const response = await fetch(`${API_BASE_URL}/training/formations/mes_formations/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement de vos formations');
    }
    
    return response.json();
  }

  // Méthodes admin
  async createFormation(formationData) {
    const response = await fetch(`${API_BASE_URL}/training/formations/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(formationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création');
    }
    
    return response.json();
  }

  async updateFormation(id, formationData) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${id}/`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(formationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la modification');
    }
    
    return response.json();
  }

  async deleteFormation(id) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${id}/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }
    
    return true;
  }

  async getFormationParticipants(formationId) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${formationId}/participants/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des participants');
    }
    
    return response.json();
  }

  async getStatistiques() {
    const response = await fetch(`${API_BASE_URL}/training/formations/statistiques/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des statistiques');
    }
    
    return response.json();
  }

  // Certificats
  async getCertificats() {
    const response = await fetch(`${API_BASE_URL}/training/certificats/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des certificats');
    }
    
    return response.json();
  }

  async verifierCertificat(certificatId) {
    const response = await fetch(`${API_BASE_URL}/training/certificats/${certificatId}/verifier/`, {
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du certificat');
    }
    
    return response.json();
  }

  // Modules
  async createModule(formationId, moduleData) {
    const response = await fetch(`${API_BASE_URL}/training/formations/${formationId}/modules/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création du module');
    }
    
    return response.json();
  }

  async updateModule(moduleId, moduleData) {
    const response = await fetch(`${API_BASE_URL}/training/modules/${moduleId}/`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la modification du module');
    }
    
    return response.json();
  }

  async deleteModule(moduleId) {
    const response = await fetch(`${API_BASE_URL}/training/modules/${moduleId}/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du module');
    }
    
    return true;
  }
}

export default new TrainingService();
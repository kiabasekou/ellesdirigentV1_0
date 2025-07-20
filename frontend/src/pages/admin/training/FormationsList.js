import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const FormationsList = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categorie: '',
    niveau: '',
    status: ''
  });

  useEffect(() => {
    fetchFormations();
  }, [filters]);

  const fetchFormations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/training/formations/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormations(data.results || data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/training/formations/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setFormations(formations.filter(f => f.id !== id));
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'published': { color: 'bg-green-100 text-green-800', text: 'Publiée' },
      'draft': { color: 'bg-yellow-100 text-yellow-800', text: 'Brouillon' },
      'archived': { color: 'bg-gray-100 text-gray-800', text: 'Archivée' }
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Formations</h1>
              <p className="text-gray-600">{formations.length} formation(s) au total</p>
            </div>
            <Link
              to="/admin/formations/create"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Formation
            </Link>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({...filters, categorie: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Toutes</option>
                <option value="leadership">Leadership</option>
                <option value="communication">Communication</option>
                <option value="campagne">Campagne</option>
                <option value="gouvernance">Gouvernance</option>
                <option value="negociation">Négociation</option>
                <option value="droits_femmes">Droits des femmes</option>
                <option value="economie">Économie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
              <select
                value={filters.niveau}
                onChange={(e) => setFilters({...filters, niveau: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="published">Publiée</option>
                <option value="draft">Brouillon</option>
                <option value="archived">Archivée</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ categorie: '', niveau: '', status: '' })}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des formations */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {formations.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre première formation.</p>
              <Link
                to="/admin/formations/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Créer une formation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planning
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formations.map((formation) => {
                    const statusBadge = getStatusBadge(formation.status);
                    return (
                      <tr key={formation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formation.titre}</div>
                            <div className="text-sm text-gray-500">
                              {formation.niveau} • {formation.duree_heures}h • {formation.formateur}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formation.categorie}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(formation.date_debut)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-32">{formation.lieu}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{formation.participants_count || 0}/{formation.max_participants}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => window.open(`/formations/${formation.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/admin/formations/${formation.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(formation.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationsList;
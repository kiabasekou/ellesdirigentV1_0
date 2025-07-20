import React, { useState } from 'react';
import { Save, X, Plus, Calendar, MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateFormation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formation, setFormation] = useState({
    titre: '',
    slug: '',
    description: '',
    objectifs: [''],
    prerequis: '',
    categorie: 'leadership',
    niveau: 'debutant',
    status: 'published',
    duree_heures: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    est_en_ligne: false,
    lien_visio: '',
    max_participants: '',
    cout: '0',
    materiel_requis: '',
    formateur: '',
    formateur_bio: '',
    certificat_delivre: true,
    quiz_requis: false,
    note_minimale: '70'
  });

  const categories = [
    { value: 'leadership', label: 'Leadership' },
    { value: 'communication', label: 'Communication' },
    { value: 'campagne', label: 'Campagne électorale' },
    { value: 'gouvernance', label: 'Gouvernance' },
    { value: 'negociation', label: 'Négociation' },
    { value: 'droits_femmes', label: 'Droits des femmes' },
    { value: 'economie', label: 'Économie politique' }
  ];

  const niveaux = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const handleChange = (field, value) => {
    setFormation(prev => ({ ...prev, [field]: value }));
    
    // Auto-générer le slug à partir du titre
    if (field === 'titre') {
      const slug = value.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormation(prev => ({ ...prev, slug }));
    }
  };

  const handleObjectifChange = (index, value) => {
    const newObjectifs = [...formation.objectifs];
    newObjectifs[index] = value;
    setFormation(prev => ({ ...prev, objectifs: newObjectifs }));
  };

  const addObjectif = () => {
    setFormation(prev => ({ 
      ...prev, 
      objectifs: [...prev.objectifs, ''] 
    }));
  };

  const removeObjectif = (index) => {
    if (formation.objectifs.length > 1) {
      const newObjectifs = formation.objectifs.filter((_, i) => i !== index);
      setFormation(prev => ({ ...prev, objectifs: newObjectifs }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/training/formations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formation,
          objectifs: formation.objectifs.filter(obj => obj.trim() !== '')
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Formation créée avec succès !');
        navigate('/admin/formations');
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la formation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Créer une Formation</h1>
              <p className="text-gray-600">Ajouter une nouvelle formation au catalogue</p>
            </div>
            <button
              onClick={() => navigate('/admin/formations')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la formation *
                </label>
                <input
                  type="text"
                  value={formation.titre}
                  onChange={(e) => handleChange('titre', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="ex: Leadership Féminin en Politique"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formation.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="leadership-feminin-politique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formation.categorie}
                  onChange={(e) => handleChange('categorie', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau *
                </label>
                <select
                  value={formation.niveau}
                  onChange={(e) => handleChange('niveau', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {niveaux.map(niveau => (
                    <option key={niveau.value} value={niveau.value}>{niveau.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formation.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Description détaillée de la formation..."
                />
              </div>
            </div>
          </div>

          {/* Objectifs pédagogiques */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Objectifs pédagogiques</h2>
            
            <div className="space-y-3">
              {formation.objectifs.map((objectif, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={objectif}
                    onChange={(e) => handleObjectifChange(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Objectif ${index + 1}`}
                  />
                  {formation.objectifs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjectif(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addObjectif}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter un objectif
              </button>
            </div>
          </div>

          {/* Planning et logistique */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Planning et logistique</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Durée (heures) *
                </label>
                <input
                  type="number"
                  value={formation.duree_heures}
                  onChange={(e) => handleChange('duree_heures', e.target.value)}
                  min="1"
                  max="200"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Participants max *
                </label>
                <input
                  type="number"
                  value={formation.max_participants}
                  onChange={(e) => handleChange('max_participants', e.target.value)}
                  min="1"
                  max="500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  value={formation.date_debut}
                  onChange={(e) => handleChange('date_debut', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de fin *
                </label>
                <input
                  type="datetime-local"
                  value={formation.date_fin}
                  onChange={(e) => handleChange('date_fin', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Lieu *
                </label>
                <input
                  type="text"
                  value={formation.lieu}
                  onChange={(e) => handleChange('lieu', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="ex: Centre de Formation, Libreville"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="est_en_ligne"
                    checked={formation.est_en_ligne}
                    onChange={(e) => handleChange('est_en_ligne', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="est_en_ligne" className="text-sm font-medium text-gray-700">
                    Formation en ligne
                  </label>
                </div>
              </div>

              {formation.est_en_ligne && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lien de visioconférence
                  </label>
                  <input
                    type="url"
                    value={formation.lien_visio}
                    onChange={(e) => handleChange('lien_visio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Formateur */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Formateur</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du formateur *
                </label>
                <input
                  type="text"
                  value={formation.formateur}
                  onChange={(e) => handleChange('formateur', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="ex: Dr. Marie Eyenga, Experte en Leadership"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biographie du formateur
                </label>
                <textarea
                  value={formation.formateur_bio}
                  onChange={(e) => handleChange('formateur_bio', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Présentation et qualifications du formateur..."
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Coût (FCFA)
                </label>
                <input
                  type="number"
                  value={formation.cout}
                  onChange={(e) => handleChange('cout', e.target.value)}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note minimale (%)
                </label>
                <input
                  type="number"
                  value={formation.note_minimale}
                  onChange={(e) => handleChange('note_minimale', e.target.value)}
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="certificat_delivre"
                    checked={formation.certificat_delivre}
                    onChange={(e) => handleChange('certificat_delivre', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="certificat_delivre" className="text-sm font-medium text-gray-700">
                    Délivrer un certificat à la fin
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="quiz_requis"
                    checked={formation.quiz_requis}
                    onChange={(e) => handleChange('quiz_requis', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="quiz_requis" className="text-sm font-medium text-gray-700">
                    Quiz de validation requis
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/formations')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Créer la formation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormation;
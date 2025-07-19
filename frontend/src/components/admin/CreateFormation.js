// frontend/src/components/admin/CreateFormation.js
import React, { useState } from 'react';

const CreateFormation = () => {
  const [formation, setFormation] = useState({
    titre: '',
    description: '',
    categorie: 'leadership',
    niveau: 'debutant',
    duree_heures: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    est_en_ligne: false,
    max_participants: '',
    formateur: '',
    cout: '0'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/formations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formation)
      });
      
      if (response.ok) {
        alert('Formation créée avec succès !');
        // Réinitialiser le formulaire
        setFormation({...initialState});
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Créer une nouvelle formation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Titre de la formation *
          </label>
          <input
            type="text"
            value={formation.titre}
            onChange={(e) => setFormation({...formation, titre: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={formation.description}
            onChange={(e) => setFormation({...formation, description: e.target.value})}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Catégorie *
            </label>
            <select
              value={formation.categorie}
              onChange={(e) => setFormation({...formation, categorie: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="leadership">Leadership</option>
              <option value="communication">Communication</option>
              <option value="campagne">Campagne électorale</option>
              <option value="gouvernance">Gouvernance</option>
              <option value="negociation">Négociation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Niveau *
            </label>
            <select
              value={formation.niveau}
              onChange={(e) => setFormation({...formation, niveau: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Date de début *
            </label>
            <input
              type="datetime-local"
              value={formation.date_debut}
              onChange={(e) => setFormation({...formation, date_debut: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date de fin *
            </label>
            <input
              type="datetime-local"
              value={formation.date_fin}
              onChange={(e) => setFormation({...formation, date_fin: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Lieu de formation *
          </label>
          <input
            type="text"
            value={formation.lieu}
            onChange={(e) => setFormation({...formation, lieu: e.target.value})}
            placeholder="ex: Centre de Formation, Libreville"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="en_ligne"
            checked={formation.est_en_ligne}
            onChange={(e) => setFormation({...formation, est_en_ligne: e.target.checked})}
            className="rounded"
          />
          <label htmlFor="en_ligne" className="text-sm">
            Formation en ligne
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum participants *
            </label>
            <input
              type="number"
              value={formation.max_participants}
              onChange={(e) => setFormation({...formation, max_participants: e.target.value})}
              min="1"
              max="200"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Durée (heures) *
            </label>
            <input
              type="number"
              value={formation.duree_heures}
              onChange={(e) => setFormation({...formation, duree_heures: e.target.value})}
              min="1"
              max="40"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Formateur/Formatrice *
          </label>
          <input
            type="text"
            value={formation.formateur}
            onChange={(e) => setFormation({...formation, formateur: e.target.value})}
            placeholder="ex: Dr. Marie Eyenga, Experte en Leadership"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700"
          >
            Créer la formation
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFormation;
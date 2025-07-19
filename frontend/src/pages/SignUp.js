import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nipVerified, setNipVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Étape 1: Vérification NIP
    nip: '',
    document_justificatif: null,
    
    // Étape 2: Informations personnelles
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    
    // Étape 3: Localisation
    region: '',
    ville: '',
    
    // Étape 4: Expérience politique
    experience: '',
    
    // Étape 5: Sécurité et validation
    username: '',
    password: '',
    password_confirm: '',
    accept_terms: false,
    accept_data_processing: false
  });

  const regions = [
    { value: 'estuaire', label: 'Estuaire' },
    { value: 'haut_ogooue', label: 'Haut-Ogooué' },
    { value: 'moyen_ogooue', label: 'Moyen-Ogooué' },
    { value: 'ngounie', label: 'Ngounié' },
    { value: 'nyanga', label: 'Nyanga' },
    { value: 'ogooue_ivindo', label: 'Ogooué-Ivindo' },
    { value: 'ogooue_lolo', label: 'Ogooué-Lolo' },
    { value: 'ogooue_maritime', label: 'Ogooué-Maritime' },
    { value: 'woleu_ntem', label: 'Woleu-Ntem' }
  ];

  const experienceOptions = [
    { value: 'aucune', label: 'Aucune expérience politique' },
    { value: 'locale', label: 'Expérience locale (commune, département)' },
    { value: 'regionale', label: 'Expérience régionale' },
    { value: 'nationale', label: 'Expérience nationale' },
    { value: 'internationale', label: 'Expérience internationale' }
  ];

  const steps = [
    { number: 1, title: 'Vérification NIP', description: 'Document obligatoire' },
    { number: 2, title: 'Informations personnelles', description: 'Identité complète' },
    { number: 3, title: 'Localisation', description: 'Région et ville' },
    { number: 4, title: 'Expérience politique', description: 'Parcours et intérêts' },
    { number: 5, title: 'Sécurité', description: 'Mot de passe et validation' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, document_justificatif: 'Le fichier ne peut pas dépasser 5MB' }));
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, document_justificatif: 'Seuls les fichiers PDF, JPG et PNG sont autorisés' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, document_justificatif: file }));
      setErrors(prev => ({ ...prev, document_justificatif: '' }));
    }
  };

  const verifyNIP = async () => {
    if (!formData.nip || formData.nip.length < 8) {
      setErrors({ nip: 'Le NIP doit contenir au moins 8 caractères' });
      return;
    }

    if (!formData.document_justificatif) {
      setErrors({ document_justificatif: 'Le document justificatif est obligatoire' });
      return;
    }

    setLoading(true);
    try {
      // Simulation de vérification NIP
      setTimeout(() => {
        setNipVerified(true);
        setErrors({});
        setTimeout(() => setCurrentStep(2), 1500);
        setLoading(false);
      }, 2000);
    } catch (error) {
      setErrors({ nip: 'Erreur de vérification du NIP' });
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.nip) newErrors.nip = 'Le NIP est obligatoire';
        else if (formData.nip.length < 8) newErrors.nip = 'Le NIP doit contenir au moins 8 caractères';
        if (!formData.document_justificatif) newErrors.document_justificatif = 'Le document justificatif est obligatoire';
        break;

      case 2:
        if (!formData.first_name) newErrors.first_name = 'Le prénom est obligatoire';
        if (!formData.last_name) newErrors.last_name = 'Le nom est obligatoire';
        if (!formData.email) newErrors.email = 'L\'email est obligatoire';
        if (!formData.phone) newErrors.phone = 'Le téléphone est obligatoire';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'La date de naissance est obligatoire';
        break;

      case 3:
        if (!formData.region) newErrors.region = 'La région est obligatoire';
        if (!formData.ville) newErrors.ville = 'La ville est obligatoire';
        break;

      case 4:
        if (!formData.experience) newErrors.experience = 'L\'expérience politique est obligatoire';
        break;

      case 5:
        if (!formData.username) newErrors.username = 'Le nom d\'utilisateur est obligatoire';
        if (!formData.password) newErrors.password = 'Le mot de passe est obligatoire';
        if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        if (formData.password !== formData.password_confirm) newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
        if (!formData.accept_terms) newErrors.accept_terms = 'Vous devez accepter les conditions';
        if (!formData.accept_data_processing) newErrors.accept_data_processing = 'Vous devez accepter le traitement des données';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && !nipVerified) {
      verifyNIP();
      return;
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Ajouter tous les champs
      Object.keys(formData).forEach(key => {
        if (key === 'document_justificatif' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'document_justificatif' && key !== 'password_confirm') {
          submitData.append(key, formData[key]);
        }
      });

      // Simulation de soumission
      setTimeout(() => {
        alert('Inscription réussie ! Bienvenue sur Elles Dirigent. Votre compte sera activé après vérification.');
        navigate('/login');
        setLoading(false);
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Erreur lors de l\'inscription' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête avec logo Elles Dirigent */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-4">
            <img 
              src="/logo-elles-dirigent.png" 
              alt="Elles Dirigent"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inscription</h1>
          <p className="mt-2 text-gray-600">
            Rejoignez Elles Dirigent - République Gabonaise
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8 relative">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Étape 1 - Vérification NIP */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Vérification NIP</h2>
                <p className="text-gray-600 mt-2">
                  Votre Numéro d'Identification Personnel et un document justificatif sont requis.
                </p>
              </div>

              <div>
                <label htmlFor="nip" className="block text-sm font-medium text-gray-700 mb-2">
                  NIP (Numéro d'Identification Personnel) *
                </label>
                <input
                  type="text"
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => handleInputChange('nip', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border rounded-lg ${errors.nip ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Entrez votre NIP"
                />
                {errors.nip && <p className="mt-1 text-sm text-red-600">{errors.nip}</p>}
              </div>

              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                  Document justificatif *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  errors.document_justificatif ? 'border-red-300' : 'border-gray-300'
                }`}>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Téléchargez votre CNI, passeport ou récépissé NIP
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PDF, PNG, JPG jusqu'à 5MB
                    </p>
                  </div>
                </div>
                {formData.document_justificatif && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {formData.document_justificatif.name}
                  </p>
                )}
                {errors.document_justificatif && (
                  <p className="mt-1 text-sm text-red-600">{errors.document_justificatif}</p>
                )}
              </div>

              {nipVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="ml-2 text-sm text-green-700">
                      NIP vérifié avec succès ! Redirection vers l'étape suivante...
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition duration-300 ease-in-out disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Vérifier le NIP'}
                </button>
              </div>
            </div>
          )}

          {/* Les autres étapes restent identiques mais avec les couleurs Elles Dirigent */}
          {/* ... (garder le reste du code existant avec les nouvelles couleurs) */}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
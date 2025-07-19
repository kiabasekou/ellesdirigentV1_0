# Plateforme Femmes en Politique – Version 1

# Plateforme Femmes en Politique – Version 1.0 🇬🇦

Plateforme numérique destinée à renforcer la participation des femmes en politique au Gabon.

## 📁 Structure du projet

```
plateforme_femmes/
├── backend/               # Backend Django avec API REST
│   ├── accounts/          # Authentification & utilisateurs (modèle Participante personnalisé)
│   ├── api/               # Routes principales de l’API
│   ├── document_upload/   # Upload sécurisé des documents justificatifs (CNI, NIP, Passeport)
│   ├── nip_verification/  # Vérification du NIP contre la base officielle
│   ├── users/             # Vue admin + validation manuelle des inscriptions
│   ├── templates/         # Interface admin HTML (participants en attente)
│   ├── db.sqlite3         # Base de données (exemple)
│   └── ...
│
├── frontend/              # Frontend React + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   ├── pages/         # Inclut Login.js, SignUp.js, Dashboard.js...
│   │   └── ...
│   └── ...
│
└── README.md              # Présentation du projet
```

## 🧩 Fonctionnalités clés

### Authentification & Inscription
- Inscription protégée avec **vérification du NIP**
- Upload obligatoire d’un **justificatif scanné** (CNI, Passeport ou récépissé NIP)
- Validation manuelle par un administrateur (statut "en attente", "validée", "rejetée")

### Backend Django
- JWT Authentication avec `djangorestframework-simplejwt`
- API RESTful bien structurée
- Vérification du NIP via import CSV
- Gestion sécurisée des documents scannés

### Frontend React
- Design responsive avec TailwindCSS
- Navigation dynamique (Dashboard, Forums, Ressources, etc.)
- Interface d’administration pour valider les inscriptions
- Icônes cohérentes via `lucide-react`

## 🚀 Prochaines étapes (version 1.1+)
- Messagerie privée entre participantes
- Statistiques dynamiques sur les profils
- Filtres géographiques et par expérience politique
- Tableaux de bord visuels avec graphiques interactifs
- Espace de réseautage sécurisé

## 🔒 Exigences techniques
- Python 3.10+
- Node.js 18+
- Django 4.x
- React 18+
- TailwindCSS 3.3

## 🛠 Setup rapide

### Backend
```bash
cd backend
python -m venv env
source env/bin/activate  # ou .\env\Scripts\activate sur Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔗 Dépôt GitHub

**Repo distant pour production :**
👉 [https://github.com/kiabasekou/plateforme_femmes_v1](https://github.com/kiabasekou/plateforme_femmes_v1)
Ce dépôt contient l'ensemble du code source (frontend et backend) de la **plateforme nationale de soutien aux femmes engagées en politique au Gabon**.

---

## 🌍 Objectif

Favoriser la participation active des femmes en politique, structurer un espace sécurisé de réseautage, de formation, de partage de ressources et de valorisation des parcours.

## 📦 Structure du projet

```
plateforme_femmes/
├── frontend/              # Application React + TailwindCSS
└── backend/               # Application Django REST API
```

---

## ✅ Fonctionnalités actuelles

### 🔐 Authentification & inscription sécurisées

* Inscription avec saisie du NIP (Numéro d'Identification Personnelle – obligatoire)
* Upload de justificatifs (scan CNI/NIP/Passeport)
* Validation manuelle par un administrateur

### 🗂️ Dashboard de l'utilisatrice

* Profil public/privé
* Forums de discussion
* Calendrier d'événements
* Accès aux ressources

### 📊 Espace administrateur

* Validation des inscriptions en attente
* Visualisation des documents scannés
* Rejet avec saisie du motif

### 📁 Upload de documents

* Gestion sécurisée des fichiers
* Accès via lien dynamique depuis l’interface d’administration

---

## 🔧 Backend Django REST

* API `POST /api/verify-nip/` : Vérifie la présence d’un NIP dans la base
* API `POST /api/upload-documents/` : Upload du fichier justificatif (PDF/Image)
* Modèle personnalisé `Participante` dérivé de `AbstractUser`
* Support multirégional et multiville
* Préparation du module d’import CSV pour une base NIP officielle

---

## 💅 Frontend React (moderne)

* Architecture modulaire avec `components/`, `pages/`, `services/`
* UI cohérente avec l’identité gabonaise, responsive, accessible
* Icônes optimisées via Lucide, Tailwind v3.3.5
* Support multilingue prévu

---

## 📁 Améliorations prévues (version 2)

1. 🔄 **Connexion réelle au backend** pour toutes les actions React (authentification, validations...)
2. 📨 **Messagerie privée** entre participantes
3. 📋 **Module de formation** (e-learning, quiz)
4. 📌 **Géolocalisation dynamique** et carte interactive
5. 📤 **Import CSV des NIP** officiels et synchronisation avec une base de données nationale
6. 📈 **Statistiques admin** sur l’inscription, la répartition régionale, l’engagement
7. 🛡️ **Gestion des rôles multiples** : admin régional, modératrice forum, etc.

---

## 🔗 Déploiement à venir

* URL de production : à définir
* Hébergement prévu sur une instance dédiée avec stockage sécurisé (ex: DigitalOcean, Scaleway)
* CI/CD GitHub Actions

---

## 📂 Repo GitHub (version stable)

🔗 [https://github.com/kiabasekou/plateforme\_femmes\_v1](https://github.com/kiabasekou/plateforme_femmes_v1)

---

**Auteur** : @kiabasekou
**Date** : Mai 2025
**Collaborateur technique** : ChatGPT v2, OpenAI

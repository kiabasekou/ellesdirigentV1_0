# 🚀 Roadmap Plateforme Femmes en Politique (V1.1 ➜ V2.0)

## ✅ Version Actuelle : V1.0
- Authentification des participantes via NIP
- Upload de document justificatif (scan CNI, NIP, passeport)
- Interface d’administration Django (`pending_participants.html`)
- Frontend React intégré (Login, Dashboard, Inscription)
- Architecture stable (backend + frontend)

---

## 🔄 Étape 1 — Validation manuelle admin (V1.1)
🎯 Objectif : Interface complète pour gérer les demandes d’inscription

### Backend
- [x] API pour changer `statut_validation` et ajouter un `motif_rejet`
- [ ] Email de notification en cas de validation ou rejet
- [ ] Ajout d’un champ `date_validation` (optionnel)

### Frontend
- [ ] Page React `PendingParticipants.js` : affichage des inscriptions
- [ ] Bouton valider / rejeter avec mini-formulaire motif de rejet
- [ ] Intégration dans la sidebar admin

---

## 📊 Étape 2 — Tableau de bord administrateur (V1.2)
🎯 Objectif : Vue synthétique et graphique

- [ ] API statistiques : nombre total, par statut, par région
- [ ] Page Dashboard Admin (React)
- [ ] Graphique circulaire (statut) et barres (région, expérience)
- [ ] Option : carte interactive (si données géographiques disponibles)

---

## 🧩 Étape 3 — Gestion profil participante (V1.3)
🎯 Objectif : Autonomie partielle et amélioration du dossier

- [ ] API sécurisée pour mise à jour du profil
- [ ] Upload d’un 2ᵉ document justificatif (facultatif)
- [ ] Historique de validation (admin logs)

---

## 📁 Étape 4 — Import CSV des NIP officiels (V1.4)
🎯 Objectif : Vérification robuste via une base officielle

- [ ] Outil d’import CSV (admin ou CLI)
- [ ] Nouvelle table : `NipReference`
- [ ] Endpoint `verify-nip/` s’appuie sur cette base

---

## ✉️ Étape 5 — Système d’emails transactionnels (V1.5)
🎯 Objectif : Communication automatisée

- [ ] Email confirmation validation
- [ ] Email de rejet avec motif
- [ ] Suivi de rappel après 48h en attente (option)

---

## 🌐 Étape 6 — Sécurité & Déploiement (V2.0)
🎯 Objectif : mise en ligne stable et sécurisée

- [ ] Configuration sécurisée (`.env`, `ALLOWED_HOSTS`, `DEBUG=False`)
- [ ] Auth JWT complète (refresh, expiration)
- [ ] Déploiement (Render, Heroku, VPS, Dokku)
- [ ] Stockage distant des documents (S3, etc.)
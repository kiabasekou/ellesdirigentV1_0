# Intégration Authentification Réelle (JWT) — Femmes en Politique

## ✅ Composants inclus :
- `Dashboard.js` : Affiche le prénom et le statut de validation de l’utilisatrice.
- `PrivateRoute.js` : Protège les routes privées en vérifiant l’authentification via Redux.

## 🔧 Intégration dans App.js :
```jsx
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import PrivateRoute from './components/PrivateRoute';

<Routes>
  <Route path="/dashboard" element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } />
</Routes>
```

## 🛠 Pré-requis :
- Redux store configuré avec `auth.user` et `auth.accessToken`
- `react-router-dom` installé (`v6+`)
- `jwt-decode` pour décoder le token au login
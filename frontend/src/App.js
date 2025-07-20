/**
 * Application principale avec:
 * - Routing optimisé avec lazy loading
 * - Gestion des erreurs globale
 * - Monitoring des performances
 * - Layout responsive
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import { ToastProvider, ToastWrapper, ToastContainer } from './components/Toast';

// Ajouter ces imports lazy loading
const FormationsPage = lazy(() => import('./pages/training/FormationsPage'));
const MyFormationsPage = lazy(() => import('./pages/training/MyFormationsPage'));
const FormationDetailPage = lazy(() => import('./pages/training/FormationDetailPage'));
const CertificatesPage = lazy(() => import('./pages/training/CertificatesPage'));

// Pages admin formations
const AdminFormationsDashboard = lazy(() => import('./pages/admin/training/TrainingDashboard'));
const AdminQuizManagement = lazy(() => import('./pages/admin/training/QuizManagement'));
// Lazy loading des pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Forums = lazy(() => import('./pages/Forums'));
const Events = lazy(() => import('./pages/Events'));
const Resources = lazy(() => import('./pages/Resources'));
const Networking = lazy(() => import('./pages/Networking'));
const Stats = lazy(() => import('./pages/Stats'));
const EnAttente = lazy(() => import('./pages/EnAttente'));
const Rejetee = lazy(() => import('./pages/Rejetee'));

// Pages admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const PendingParticipants = lazy(() => import('./pages/admin/PendingParticipants'));
const CreateFormation = lazy(() => import('./pages/admin/training/CreateFormation'));
const FormationsList = lazy(() => import('./pages/admin/training/FormationsList'));
const EditFormation = lazy(() => import('./pages/admin/training/EditFormation'));

// Layout principal
const MainLayout = lazy(() => import('./components/layout/MainLayout'));

const App = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ToastWrapper>
          <ErrorBoundary>
            <Router>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Page d'accueil avec inscription/connexion */}
                  <Route path="/" element={<Home />} />
                  
                  {/* Routes publiques */}
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/register" element={<Navigate to="/signup" replace />} />

                  {/* Routes protégées avec MainLayout */}
                  <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="forums" element={<Forums />} />
                    <Route path="events" element={<Events />} />
                    <Route path="resources" element={<Resources />} />
                    <Route path="networking" element={<Networking />} />
                    <Route path="stats" element={<Stats />} />
                    <Route path="formations" element={<FormationsPage />} />
                    <Route path="formations/:id" element={<FormationDetailPage />} />
                    <Route path="mes-formations" element={<MyFormationsPage />} />
                    <Route path="certificats" element={<CertificatesPage />} />
                  </Route>

                  {/* Routes protégées hors layout */}
                  <Route path="/en_attente" element={<ProtectedRoute><EnAttente /></ProtectedRoute>} />
                  <Route path="/rejetee" element={<ProtectedRoute><Rejetee /></ProtectedRoute>} />

                {/* Routes Admin */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireStaff={true}>
                      <MainLayout isAdmin={true} />
                    </ProtectedRoute>
                  }
                >
                  {/* Routes enfants */}
                  <Route index element={<AdminDashboard />} />
                  <Route path="participants/pending" element={<PendingParticipants />} />
                  <Route path="formations" element={<AdminFormationsDashboard />} />
                  <Route path="quiz" element={<AdminQuizManagement />} />
                  <Route path="formations" element={<FormationsList />} />
                  <Route path="formations/create" element={<CreateFormation />} />
                  <Route path="formations/:id/edit" element={<EditFormation />} /> 
                </Route>


                  {/* Page 404 */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
                        <a href="/" className="text-blue-600 hover:text-blue-700">
                          Retour à l'accueil
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
              </Suspense>

              {/* Composants globaux */}
              <ToastContainer />
            </Router>
          </ErrorBoundary>
        </ToastWrapper>
      </ToastProvider>
    </Provider>
  );
};

export default App;
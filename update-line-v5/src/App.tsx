import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SecurityFAB from './components/SecurityFAB';
import ProfileErrorFallback from './components/ProfileErrorFallback';

// Chargement à la demande (code-splitting par route) : chaque page n'est téléchargée que
// lorsqu'on y accède, ce qui réduit fortement le poids du premier chargement. Important pour
// le public visé, qui a souvent une connexion mobile limitée.
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const SignalementPage = lazy(() => import('./modules/security/SignalementPage'));
const WellnessCheckinPage = lazy(() => import('./modules/wellness/WellnessCheckinPage'));
const AdminCentrePage = lazy(() => import('./modules/admin/AdminCentrePage'));
const ClubPage = lazy(() => import('./modules/club/ClubPage'));
const SchoolPage = lazy(() => import('./modules/school/SchoolPage'));
const OpportunitiesPage = lazy(() => import('./modules/opportunities/OpportunitiesPage'));
const MentorPage = lazy(() => import('./modules/mentor/MentorPage'));
const CommunityPage = lazy(() => import('./modules/community/CommunityPage'));
const StatsPage = lazy(() => import('./modules/stats/StatsPage'));
const ParentDashboardPage = lazy(() => import('./modules/parent/ParentDashboardPage'));
const ConformitePage = lazy(() => import('./modules/conformite/ConformitePage'));
const ProfileEditPage = lazy(() => import('./modules/dashboard/ProfileEditPage'));
const Programme2050Page = lazy(() => import('./modules/programme2050/Programme2050Page'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const CentreSignupPage = lazy(() => import('./pages/CentreSignupPage'));
const RecruiterSignupPage = lazy(() => import('./pages/RecruiterSignupPage'));
const PendingConsentPage = lazy(() => import('./pages/PendingConsentPage'));
const ConsentConfirmPage = lazy(() => import('./pages/ConsentConfirmPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));

function PageLoader() {
  return <p className="p-6">Chargement…</p>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, profileLoading, profileError, needsParentalConsent } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (profileError) return <ProfileErrorFallback />;
  if (profileLoading) return <PageLoader />;
  if (needsParentalConsent) return <Navigate to="/pending-consent" replace />;
  return <>{children}</>;
}

function RoleHome() {
  const { profile } = useAuth();
  if (profile?.role === 'parent') return <ParentDashboardPage />;
  return <DashboardPage />;
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup-centre" element={<CentreSignupPage />} />
          <Route path="/signup-recruteur" element={<RecruiterSignupPage />} />
          <Route path="/pending-consent" element={<PendingConsentPage />} />
          <Route path="/consentement/:token" element={<ConsentConfirmPage />} />
          <Route path="/programme-2050" element={<Programme2050Page />} />
          <Route path="/" element={<PrivateRoute><RoleHome /></PrivateRoute>} />
          <Route path="/guide" element={<PrivateRoute><GuidePage /></PrivateRoute>} />
          <Route path="/security" element={<PrivateRoute><SignalementPage /></PrivateRoute>} />
          <Route path="/wellness" element={<PrivateRoute><WellnessCheckinPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminCentrePage /></PrivateRoute>} />
          <Route path="/conformite" element={<PrivateRoute><ConformitePage /></PrivateRoute>} />
          <Route path="/profil" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
          <Route path="/club" element={<PrivateRoute><ClubPage /></PrivateRoute>} />
          <Route path="/school" element={<PrivateRoute><SchoolPage /></PrivateRoute>} />
          <Route path="/opportunities" element={<PrivateRoute><OpportunitiesPage /></PrivateRoute>} />
          <Route path="/mentor" element={<PrivateRoute><MentorPage /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {session && <SecurityFAB />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardPage from './modules/dashboard/DashboardPage';
import SignalementPage from './modules/security/SignalementPage';
import WellnessCheckinPage from './modules/wellness/WellnessCheckinPage';
import AdminCentrePage from './modules/admin/AdminCentrePage';
import ClubPage from './modules/club/ClubPage';
import SchoolPage from './modules/school/SchoolPage';
import OpportunitiesPage from './modules/opportunities/OpportunitiesPage';
import MentorPage from './modules/mentor/MentorPage';
import CommunityPage from './modules/community/CommunityPage';
import StatsPage from './modules/stats/StatsPage';
import ParentDashboardPage from './modules/parent/ParentDashboardPage';
import ConformitePage from './modules/conformite/ConformitePage';
import Programme2050Page from './modules/programme2050/Programme2050Page';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CentreSignupPage from './pages/CentreSignupPage';
import RecruiterSignupPage from './pages/RecruiterSignupPage';
import PendingConsentPage from './pages/PendingConsentPage';
import ConsentConfirmPage from './pages/ConsentConfirmPage';
import GuidePage from './pages/GuidePage';
import SecurityFAB from './components/SecurityFAB';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, needsParentalConsent } = useAuth();
  if (loading) return <p className="p-6">Chargement…</p>;
  if (!session) return <Navigate to="/login" replace />;
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
        <Route path="/club" element={<PrivateRoute><ClubPage /></PrivateRoute>} />
        <Route path="/school" element={<PrivateRoute><SchoolPage /></PrivateRoute>} />
        <Route path="/opportunities" element={<PrivateRoute><OpportunitiesPage /></PrivateRoute>} />
        <Route path="/mentor" element={<PrivateRoute><MentorPage /></PrivateRoute>} />
        <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import SiteLayout from '@/components/site/SiteLayout';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import Quote from '@/pages/Quote';
import Admin from '@/pages/Admin';
import PayPalSettings from '@/pages/PayPalSettings';
import Guide from '@/pages/Guide';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PaymentReturn from '@/pages/PaymentReturn';
import PaymentCancel from '@/pages/PaymentCancel';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const returnTo = location.pathname + location.search + location.hash;
  const loginPath = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Routes>
      {/* Public pages remain available without creating an account. */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/quote" element={<Quote />} />
      </Route>

      {/* Staff and payment controls require a signed-in user; pages enforce admin role. */}
      <Route
        element={
          <ProtectedRoute
            unauthenticatedElement={<Navigate to={loginPath} replace />}
          />
        }
      >
        <Route element={<SiteLayout />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/payments" element={<PayPalSettings />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment/return" element={<PaymentReturn />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

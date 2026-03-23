import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Web3Provider } from '@/contexts/Web3Context';
import { PerformanceProvider } from '@/contexts/PerformanceContext';
import { usePerformance } from '@/contexts/PerformanceContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AuthForm } from '@/components/AuthForm';
import { useAdmin } from '@/hooks/useAdmin';

// Lazy load heavy components for better initial load
const Dashboard = lazy(() => import('@/components/Dashboard').then(m => ({ default: m.Dashboard })));
const BlocksView = lazy(() => import('@/components/BlocksView').then(m => ({ default: m.BlocksView })));
const NodesView = lazy(() => import('@/components/NodesView').then(m => ({ default: m.NodesView })));
const DevicesView = lazy(() => import('@/components/DevicesView').then(m => ({ default: m.DevicesView })));
const PermissionsView = lazy(() => import('@/components/PermissionsView').then(m => ({ default: m.PermissionsView })));
const DatasetUpload = lazy(() => import('@/components/DatasetUpload').then(m => ({ default: m.DatasetUpload })));
const VerificationView = lazy(() => import('@/components/VerificationView').then(m => ({ default: m.VerificationView })));
const AdminView = lazy(() => import('@/components/AdminView').then(m => ({ default: m.AdminView })));
const PerformanceView = lazy(() => import('@/components/PerformanceView').then(m => ({ default: m.PerformanceView })));


// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="animate-pulse space-y-4 text-center">
      <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);
const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        setShowAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleShowAuth = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setShowAuth(false);
    setActiveTab(tab);
  }, []);

  const content = useMemo(() => {
    if (showAuth) {
      return <AuthForm onSuccess={handleAuthSuccess} />;
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        {activeTab === 'dashboard' && <Dashboard onShowAuth={handleShowAuth} />}
        {activeTab === 'upload' && <DatasetUpload onShowAuth={handleShowAuth} />}
        {activeTab === 'verify' && <VerificationView onShowAuth={handleShowAuth} />}
        {activeTab === 'blocks' && <BlocksView onShowAuth={handleShowAuth} />}
        {activeTab === 'nodes' && <NodesView onShowAuth={handleShowAuth} />}
        {activeTab === 'devices' && <DevicesView onShowAuth={handleShowAuth} />}
        {activeTab === 'permissions' && <PermissionsView onShowAuth={handleShowAuth} />}
        {activeTab === 'performance' && <PerformanceView onShowAuth={handleShowAuth} />}
        {activeTab === 'admin' && <AdminView onShowAuth={handleShowAuth} />}
      </Suspense>
    );
  }, [activeTab, showAuth, handleShowAuth, handleAuthSuccess]);

  return (
    <Web3Provider>
      <div className="min-h-screen bg-background grid-pattern">
        <Header 
          isAuthenticated={isAuthenticated} 
          onShowAuth={handleShowAuth}
        />
        <div className="flex">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            isAdmin={isAdmin}
          />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {content}
            </div>
          </main>
        </div>
      </div>
    </Web3Provider>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Web3Provider } from '@/contexts/Web3Context';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { BlocksView } from '@/components/BlocksView';
import { NodesView } from '@/components/NodesView';
import { DevicesView } from '@/components/DevicesView';
import { PermissionsView } from '@/components/PermissionsView';
import { RecordDataForm } from '@/components/RecordDataForm';
import { VerificationView } from '@/components/VerificationView';
import { AuthForm } from '@/components/AuthForm';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const renderContent = () => {
    if (showAuth) {
      return <AuthForm onSuccess={handleAuthSuccess} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onShowAuth={handleShowAuth} />;
      case 'record':
        return <RecordDataForm onShowAuth={handleShowAuth} />;
      case 'verify':
        return <VerificationView onShowAuth={handleShowAuth} />;
      case 'blocks':
        return <BlocksView onShowAuth={handleShowAuth} />;
      case 'nodes':
        return <NodesView onShowAuth={handleShowAuth} />;
      case 'devices':
        return <DevicesView onShowAuth={handleShowAuth} />;
      case 'permissions':
        return <PermissionsView />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p className="font-mono">Coming soon...</p>
          </div>
        );
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-background grid-pattern">
        <Header 
          isAuthenticated={isAuthenticated} 
          onShowAuth={handleShowAuth}
        />
        <div className="flex">
          <Sidebar activeTab={activeTab} onTabChange={(tab) => {
            setShowAuth(false);
            setActiveTab(tab);
          }} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </Web3Provider>
  );
};

export default Index;

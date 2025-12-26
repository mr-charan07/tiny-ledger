import { useState } from 'react';
import { Web3Provider } from '@/contexts/Web3Context';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { BlocksView } from '@/components/BlocksView';
import { NodesView } from '@/components/NodesView';
import { DevicesView } from '@/components/DevicesView';
import { PermissionsView } from '@/components/PermissionsView';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'blocks':
        return <BlocksView />;
      case 'nodes':
        return <NodesView />;
      case 'devices':
        return <DevicesView />;
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
        <Header />
        <div className="flex">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, Sidebar, TabType } from '@/components/layout';
import {
  DashboardTab,
  CalendarTab,
  ChecklistsTab,
  DocumentsTab,
  ArchiveTab,
  HRTab,
  FinanceTab,
  SupportTab,
} from '@/components/demo/tabs';
import { ProfileModal } from '@/components/demo/modals';
import { ProjectOnboarding } from '@/components/demo/ProjectOnboarding';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, token, isLoading, isAuthenticated, refreshUser, logout } = useAuth();

  const store = useDemoStore();

  // Sync user data from auth to demo store
  useEffect(() => {
    if (user) {
      store.updateProfile({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        inn: user.inn || '',
        ogrn: user.ogrn || '',
        projectName: user.project?.name || '',
        grantAmount: user.project?.grantAmount || 500000,
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleCreateProject = async (name: string, grantAmount: number) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, grantAmount }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create project');
    }

    await refreshUser();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no project
  if (user && !user.project) {
    return <ProjectOnboarding onCreateProject={handleCreateProject} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;

      case 'calendar':
        return <CalendarTab />;

      case 'checklists':
        return <ChecklistsTab />;

      case 'documents':
        return <DocumentsTab />;

      case 'archive':
        return (
          <ArchiveTab
            grantAmount={store.userProfile.grantAmount}
            services={store.services}
            equipment={store.equipment}
            onAddService={store.addService}
            onDeleteService={store.deleteService}
            onAddServiceDocument={store.addServiceDocument}
            onDeleteServiceDocument={store.deleteServiceDocument}
            onAddEquipment={store.addEquipment}
            onDeleteEquipment={store.deleteEquipment}
            onAddEquipmentDocument={store.addEquipmentDocument}
            onDeleteEquipmentDocument={store.deleteEquipmentDocument}
          />
        );

      case 'hr':
        return <HRTab />;

      case 'finance':
        return <FinanceTab />;

      case 'support':
        return <SupportTab />;

      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        userName={user?.name || store.userProfile.name}
        onProfileClick={() => setShowProfileModal(true)}
        onLogout={logout}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Sidebar - hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-20">
              <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>

          {/* Mobile Sidebar */}
          <div className="lg:hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {renderTab()}
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={store.userProfile}
        onSave={store.updateProfile}
        isPremium={user?.isPremium}
        onTogglePremium={async (value: boolean) => {
          const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isPremium: value }),
          });
          if (response.ok) {
            await refreshUser();
          }
        }}
      />
    </div>
  );
}

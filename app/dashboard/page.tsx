"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, Sidebar, TabType } from "@/components/layout";
import {
  DashboardTab,
  CalendarTab,
  ChecklistsTab,
  DocumentsTab,
  HRTab,
  FinanceTab,
  AnalyticsTab,
  SupportTab,
  AiAssistantTab,
} from "@/components/demo/tabs";
import { ProfileModal } from "@/components/demo/modals";
import { ProjectOnboarding } from "@/components/demo/ProjectOnboarding";
import { AiChatWidget } from "@/components/AiChatWidget";
import { useDemoStore } from "@/hooks/useDemoStore";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, token, isLoading, isAuthenticated, refreshUser, logout } =
    useAuth();

  const store = useDemoStore();

  // Sync user data from auth to demo store
  useEffect(() => {
    if (user) {
      const project = user.project as { name?: string; grantAmount?: number; reportDates?: Array<{ id: string; title: string; date: string }> } | null;
      store.updateProfile({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        inn: user.inn || "",
        ogrn: user.ogrn || "",
        projectName: project?.name || "",
        grantAmount: project?.grantAmount || 500000,
        reportDates: project?.reportDates?.map(rd => ({
          id: rd.id,
          title: rd.title,
          date: rd.date,
        })) || [],
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleCreateProject = async (name: string, grantAmount: number) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, grantAmount }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create project");
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
      case "dashboard":
        return <DashboardTab />;

      case "calendar":
        return <CalendarTab />;

      case "checklists":
        return <ChecklistsTab />;

      case "documents":
        return <DocumentsTab />;

      case "hr":
        return <HRTab />;

      case "finance":
        return <FinanceTab />;

      case "analytics":
        return <AnalyticsTab />;

      case "support":
        return <SupportTab />;

      case "ai-assistant":
        return <AiAssistantTab />;

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

      {/* Sidebar - fixed on desktop */}
      <div className="hidden lg:block fixed top-[112px] left-4 xl:left-[calc((100vw-1280px)/2+16px)] w-64 xl:w-72">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="lg:ml-72 xl:ml-80">{renderTab()}</div>
      </div>

      {activeTab !== 'ai-assistant' && <AiChatWidget />}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={store.userProfile}
        onSave={async (profileData) => {
          const response = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: profileData.name,
              phone: profileData.phone,
              inn: profileData.inn,
              ogrn: profileData.ogrn,
              projectName: profileData.projectName,
              grantAmount: profileData.grantAmount,
              reportDates: profileData.reportDates,
            }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Ошибка сохранения профиля');
          }
          store.updateProfile(profileData);
          await refreshUser();
        }}
        isPremium={user?.isPremium}
        onTogglePremium={async (value: boolean) => {
          const response = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
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

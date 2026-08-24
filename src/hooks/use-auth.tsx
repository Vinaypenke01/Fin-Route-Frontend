import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, UserProfile, WorkspaceSummary } from "../lib/services/auth-service";
import { guestWorkspaceService } from "../lib/services/guest-workspace-service";
import { getAccessToken } from "../lib/api-client";

interface AuthContextType {
  user: UserProfile | null;
  workspace: WorkspaceSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authService.getMe();
      setUser(me);

      if (me.account_type === "guest") {
        try {
          const ws = await guestWorkspaceService.getWorkspace();
          setWorkspace({
            public_id: ws.public_id,
            name: ws.name,
            plan: ws.subscription_plan,
            status: ws.status,
            subscription_start_date: ws.subscription_start_date,
            subscription_end_date: ws.subscription_end_date,
          });
        } catch {
          setWorkspace(null);
        }
      }
    } catch {
      setUser(null);
      setWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login(identifier, pass);
      setUser(data.user);
      setWorkspace(data.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setWorkspace(null);
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

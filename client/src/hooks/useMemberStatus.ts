import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

export type MemberStatus = "unregistered" | "pending" | "active" | "rejected" | "loading" | "error";

interface MemberStatusData {
  status: MemberStatus;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
    approvalStatus: string;
  };
  roles?: {
    isProfessional: boolean;
    isJobSeeker: boolean;
    isEmployer: boolean;
    isBusinessOwner: boolean;
    isInvestor: boolean;
  };
}

export function useMemberStatus() {
  const { currentUser, loading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<MemberStatusData>({
    queryKey: ["/api/auth/member-status"],
    enabled: !authLoading && !!currentUser,
    retry: false,
    queryFn: async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          return { status: "unregistered" as MemberStatus };
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          return { status: "unregistered" as MemberStatus };
        }

        if (!response.ok) {
          throw new Error("Failed to fetch member status");
        }

        const data = await response.json();

        if (!data.user) {
          return { status: "unregistered" as MemberStatus };
        }

        // Check if user has been rejected (check both status and approvalStatus for compatibility)
        const approvalStatus = data.user.approvalStatus || data.user.status;
        if (approvalStatus === "rejected") {
          return {
            status: "rejected" as MemberStatus,
            user: data.user,
            roles: data.roles,
          };
        }

        // All other authenticated users are active (pending, approved, or undefined)
        return {
          status: "active" as MemberStatus,
          user: data.user,
          roles: data.roles,
        };
      } catch (err) {
        console.error("Member status check failed:", err);
        return { status: "error" as MemberStatus };
      }
    },
  });

  if (authLoading || isLoading) {
    return { status: "loading" as MemberStatus, data: undefined, refetch };
  }

  if (!currentUser) {
    return { status: "unregistered" as MemberStatus, data: undefined, refetch };
  }

  return { 
    status: data?.status || "error" as MemberStatus, 
    data, 
    refetch 
  };
}

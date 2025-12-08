import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserRoles } from "../../../shared/types";
import { checkEmailExists } from "@/lib/emailValidation";
import { toFirestoreRoles } from "@shared/roleUtils";

interface ProfileData {
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  languages?: string[] | null;
  headline?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  professionalData?: Record<string, unknown>;
  jobSeekerData?: Record<string, unknown>;
  employerData?: Record<string, unknown>;
  businessOwnerData?: Record<string, unknown>;
  investorData?: Record<string, unknown>;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  register: (email: string, password: string, name: string, roles: UserRoles, profileData?: ProfileData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrateBackendRoles(firebaseUser: FirebaseUser, existingUserData: User): Promise<User | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error("Failed to fetch backend roles:", response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const backendRoles = data.roles;

      // Treat null/missing roles as an empty role set instead of failing
      // This handles the case where a fresh account hasn't been fully persisted yet
      const mergedUserData: User = {
        ...existingUserData,
        roles: {
          professional: backendRoles?.professional || false,
          jobSeeker: backendRoles?.jobSeeker || false,
          employer: backendRoles?.employer || false,
          businessOwner: backendRoles?.businessOwner || false,
          investor: backendRoles?.investor || false,
          admin: backendRoles?.admin || false,
        },
      };

      setUserData(mergedUserData);
      return mergedUserData;
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        console.error("Backend roles fetch timed out");
      } else {
        console.error("Error hydrating backend roles:", error);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function syncUserToBackend(user: User, firebaseUser: FirebaseUser, retries = 3): Promise<boolean> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        console.log(`Syncing user to backend (attempt ${attempt + 1}/${retries})...`);
        const token = await firebaseUser.getIdToken();
        
        const response = await fetch("/api/auth/complete-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profile: {
              fullName: user.name,
              country: user.country || "",
              city: user.city || null,
              phone: user.phone || null,
              languages: user.languages || null,
              headline: user.headline || null,
              bio: user.bio || null,
              linkedinUrl: user.links?.linkedin || null,
              websiteUrl: user.links?.website || null,
              portfolioUrl: user.links?.portfolio || null,
            },
            roles: user.roles || {},
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          console.log("Backend registration successful, fetching roles...");
          const hydratedUser = await hydrateBackendRoles(firebaseUser, user);
          if (!hydratedUser) {
            lastError = new Error("Failed to fetch roles from backend");
            if (attempt < retries - 1) {
              console.log("Retrying after delay...");
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            console.error("All retries exhausted for role hydration");
            return false;
          }
          console.log("User successfully synced to backend with roles");
          return true;
        }

        const error = await response.json();
        if (error.error === "User already registered") {
          console.log("User already registered, fetching roles...");
          const hydratedUser = await hydrateBackendRoles(firebaseUser, user);
          if (!hydratedUser) {
            lastError = new Error("User registered but failed to fetch roles from backend");
            if (attempt < retries - 1) {
              console.log("Retrying after delay...");
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            console.error("All retries exhausted for role hydration");
            return false;
          }
          console.log("User roles successfully fetched");
          return true;
        }

        lastError = new Error(error.error || "Backend sync failed");
        console.error("Backend sync error:", error);
        
        if (attempt < retries - 1) {
          console.log("Retrying after delay...");
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (syncError) {
        if ((syncError as any).name === 'AbortError') {
          lastError = new Error("Backend sync request timed out");
          console.error("Backend sync timed out");
        } else {
          lastError = syncError as Error;
          console.error("Backend sync error:", syncError);
        }
        
        if (attempt < retries - 1) {
          console.log("Retrying after delay...");
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    console.error("Failed to sync user to backend after all retries:", lastError);
    return false;
  }

  async function fetchUserData(uid: string, firebaseUser?: FirebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        const normalizedRoles = data.roles ? {
          professional: data.roles.isProfessional || data.roles.professional || false,
          jobSeeker: data.roles.isJobSeeker || data.roles.jobSeeker || false,
          employer: data.roles.isEmployer || data.roles.employer || false,
          businessOwner: data.roles.isBusinessOwner || data.roles.businessOwner || false,
          investor: data.roles.isInvestor || data.roles.investor || false,
          admin: data.roles.isAdmin || data.roles.admin || false,
        } : {
          professional: false,
          jobSeeker: false,
          employer: false,
          businessOwner: false,
          investor: false,
          admin: false,
        };
        
        const userData = {
          ...data,
          uid,
          roles: normalizedRoles,
          createdAt: data.createdAt?.toDate(),
          lastUpdated: data.lastUpdated?.toDate(),
        } as User;
        
        // Try to sync to backend, but don't block login if it fails
        if (firebaseUser && !data.skipBackendSync) {
          const synced = await syncUserToBackend(userData, firebaseUser);
          if (!synced) {
            console.warn("Backend sync failed, but allowing login with Firestore data");
          }
        }
        
        // Always set user data from Firestore, even if backend sync failed
        setUserData(userData);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      throw error;
    }
  }

  async function refreshUserData() {
    if (currentUser) {
      await fetchUserData(currentUser.uid, currentUser);
    }
  }

  async function register(
    email: string,
    password: string,
    name: string,
    roles: UserRoles,
    profileData?: ProfileData
  ) {
    console.log("Starting registration process...");
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log("Checking if email already has a full account...");
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, where("email", "==", normalizedEmail));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }

    console.log("Creating Firebase user...");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    console.log("Sending email verification...");
    await sendEmailVerification(userCredential.user);

    // Check if email exists in pre-registrations (Join Now submissions)
    let preRegistrationData: any = null;
    try {
      const registrationsRef = collection(db, "registrations");
      const q = query(registrationsRef, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Email was pre-registered via "Join Now"
        preRegistrationData = querySnapshot.docs[0].data();
      }
    } catch (error) {
      console.error("Error checking pre-registration:", error);
      // Continue with registration even if pre-registration check fails
    }

    // Consolidated Firestore structure: everything in one users document
    // Use isProfessional/isJobSeeker etc. to match backend schema
    // All users are auto-approved - no approval workflow
    const status = "approved";
    
    const firestoreData: any = {
      name,
      email: normalizedEmail,
      status,
      approvalStatus: "approved",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      profileCompleted: true,
      profile: {
        fullName: name,
        phone: profileData?.phone || null,
        country: profileData?.country || null,
        city: profileData?.city || null,
        languages: profileData?.languages || null,
        headline: profileData?.headline || null,
        bio: profileData?.bio || null,
        linkedinUrl: profileData?.linkedinUrl || null,
        websiteUrl: profileData?.websiteUrl || null,
        portfolioUrl: profileData?.portfolioUrl || null,
      },
      roles: toFirestoreRoles(roles),
      professionalData: profileData?.professionalData || {},
      jobSeekerData: profileData?.jobSeekerData || {},
      employerData: profileData?.employerData || {},
      businessOwnerData: profileData?.businessOwnerData || {},
      investorData: profileData?.investorData || {},
      // Add pre-registration tracking fields
      preRegistered: preRegistrationData !== null,
      preRegisteredAt: preRegistrationData?.createdAt || null,
      registrationSource: preRegistrationData ? "join_now" : "direct",
    };

    console.log("Saving user data to Firestore...");
    await setDoc(doc(db, "users", userCredential.user.uid), firestoreData);

    const newUser: Omit<User, "uid"> = {
      name,
      email: normalizedEmail,
      roles,
      status,
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...(profileData?.phone && { phone: profileData.phone }),
      ...(profileData?.country && { country: profileData.country }),
      ...(profileData?.city && { city: profileData.city }),
      ...(profileData?.languages && { languages: profileData.languages }),
      ...(profileData?.headline && { headline: profileData.headline }),
      ...(profileData?.bio && { bio: profileData.bio }),
      links: {
        ...(profileData?.linkedinUrl && { linkedin: profileData.linkedinUrl }),
        ...(profileData?.websiteUrl && { website: profileData.websiteUrl }),
        ...(profileData?.portfolioUrl && { portfolio: profileData.portfolioUrl }),
      },
    };

    const userData: User = {
      ...newUser,
      uid: userCredential.user.uid,
    };

    console.log("Syncing user data to backend...");
    const synced = await syncUserToBackend(userData, userCredential.user);
    if (!synced) {
      console.error("Backend sync failed, signing out user");
      await firebaseSignOut(auth);
      throw new Error("Failed to complete registration. Please try again or contact support.");
    }

    console.log("Registration complete, signing out user for email verification");
    await firebaseSignOut(auth);
    console.log("Registration process finished successfully");
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const isNewUser = !userDoc.exists();

    if (isNewUser) {
      const normalizedEmail = (user.email || "").trim().toLowerCase();
      
      const emailCheck = await checkEmailExists(normalizedEmail);
      if (emailCheck.exists) {
        await firebaseSignOut(auth);
        throw new Error(emailCheck.message || "This email is already registered. Please log in with your existing account.");
      }
      
      // Check if this is an admin email
      const isAdminEmail = normalizedEmail === "admin@pef.com" || normalizedEmail === "administrator@pef.com";
      
      let preRegistrationData: any = null;
      let userStatus = "pending";
      
      try {
        const registrationsRef = collection(db, "registrations");
        const q = query(registrationsRef, where("email", "==", normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          preRegistrationData = querySnapshot.docs[0].data();
          userStatus = preRegistrationData?.status === "approved" ? "approved" : "pending";
        }
      } catch (error) {
        console.error("Error checking pre-registration:", error);
      }

      const minimalUserData = {
        name: user.displayName || "Google User",
        email: normalizedEmail,
        status: "approved",
        approvalStatus: "approved",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        profile: {
          fullName: user.displayName || "Google User",
        },
        roles: toFirestoreRoles({
          professional: false,
          jobSeeker: false,
          employer: false,
          businessOwner: false,
          investor: false,
          admin: isAdminEmail,
        }),
        professionalData: {},
        jobSeekerData: {},
        employerData: {},
        businessOwnerData: {},
        investorData: {},
        registrationSource: "google",
        preRegistered: preRegistrationData !== null,
        preRegisteredAt: preRegistrationData?.createdAt || null,
        needsRoleSelection: !isAdminEmail, // Admins don't need role selection
        skipBackendSync: !isAdminEmail, // Don't skip backend sync for admins
      };

      await setDoc(doc(db, "users", user.uid), minimalUserData);
    }

    return { isNewUser };
  }

  async function logout() {
    await firebaseSignOut(auth);
    setUserData(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid, user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    login,
    signInWithGoogle,
    register,
    logout,
    resetPassword,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

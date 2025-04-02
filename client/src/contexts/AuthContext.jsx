import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const isStudentLeader = () => {
    return userRole === "student_leader";
  };

  const isAdmin = () => {
    return userRole === "admin";
  };

  const signUp = async ({ email, password, options }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options.data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      return {
        data,
        error: null,
        message: "Please check your email for verification link",
      };
    } catch (error) {
      console.error("SignUp error:", error);
      return {
        data: null,
        error: error.message,
      };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          const role = await fetchUserRole(data.user.id);
          if (role) {
            console.log("Successfully set user role:", role);
            break;
          }
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts} failed, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { data: null, error };
    }
  };

  const fetchUserRole = async userId => {
    try {
      console.log("Fetching role for user:", userId);

      // First try to select the profile
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      // If profile exists, return the role
      if (existingProfile?.role) {
        console.log("Found existing profile with role:", existingProfile.role);
        setUserRole(existingProfile.role);
        return existingProfile.role;
      }

      // Only try to create a profile if one doesn't exist
      if (selectError?.code === "PGRST116") {
        // No profile found
        console.log("No profile found, creating new profile");
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              role: "student",
              username: user?.email || `user-${userId}`,
              updated_at: new Date().toISOString(),
            },
          ])
          .select("role")
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        console.log("New profile created with role:", newProfile.role);
        setUserRole(newProfile.role);
        return newProfile.role;
      }

      // If there was a different error querying the profile
      if (selectError) {
        throw selectError;
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return null;
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { data, error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId).single();

      if (error) throw error;
      setUserRole(newRole);
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserRole(null);

      window.localStorage.removeItem("supabase.auth.token");

      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Initializing auth...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        console.log("Auth session:", session);

        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          try {
            const response = await fetch(`${apiUrl}/api/users/role`, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (response.ok) {
              const { role } = await response.json();
              console.log("Role fetched from API:", role);
              setUserRole(role);
            } else {
              console.error("Failed to fetch role from API");
            }
          } catch (error) {
            console.error("Error fetching role from API:", error);
          }
        }
      } catch (error) {
        console.error("Error in initAuth:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user);

      if (event === "SIGNED_OUT") {
        // Clear all states
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        try {
          const response = await fetch(`${apiUrl}/api/users/role`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const { role } = await response.json();
            console.log("Role fetched from API on auth change:", role);
            setUserRole(role);
          }
        } catch (error) {
          console.error("Error fetching role on auth change:", error);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verify if user has required role
  const hasRole = requiredRole => {
    if (!userRole) return false;
    if (requiredRole === "admin") return userRole === "admin";
    if (requiredRole === "student_leader") {
      return userRole === "student_leader" || userRole === "admin";
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        fetchUserRole,
        isStudentLeader,
        isAdmin,
        updateUserRole,
        hasRole,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      <div className="hidden">
        Debug: User ID: {user?.id}, Role: {userRole || "No role"}
      </div>

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

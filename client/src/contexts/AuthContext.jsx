import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async userId => {
    try {
      // Try API first
      const session = await supabase.auth.getSession();
      const response = await fetch("http://localhost:8080/api/users/role", {
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.role;
      }
    } catch (error) {
      console.error("API role fetch failed:", error);
    }

    // Fallback to profiles table
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();

    if (error) console.error("DB role fetch failed:", error);
    return data?.role;
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const role = await fetchUserRole(currentUser.id);
        setUserRole(role);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const role = await fetchUserRole(currentUser.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: data => supabase.auth.signUp(data),
    signIn: data => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    },
    user,
    userRole,
    loading,
    fetchUserRole,
    isStudentLeader: () => userRole === "student_leader",
    isStudent: () => userRole === "student",
    isAlumni: () => userRole === "alumni",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

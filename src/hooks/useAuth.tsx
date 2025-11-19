import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to avoid deadlock
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Use server-side role verification function
      const { data, error } = await supabase.rpc('verify_user_role');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const userRole = data[0].role;
        setRole(userRole);
        
        // If user is a doctor, check approval status
        if (userRole === "doctor") {
          const { data: doctorData, error: doctorError } = await supabase
            .from("doctors")
            .select("approved")
            .eq("user_id", userId)
            .single();
          
          if (doctorError) throw doctorError;
          setIsApproved(doctorData?.approved || false);
        } else {
          setIsApproved(true);
        }
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
      setIsApproved(true);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return {
    user,
    session,
    loading,
    role,
    isApproved,
    signOut,
  };
};

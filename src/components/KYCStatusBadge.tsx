import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KYCStatusBadge = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("kyc_documents")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setKycStatus(data?.verification_status || null);
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const getBadgeConfig = () => {
    if (!kycStatus) {
      return {
        icon: AlertCircle,
        variant: "secondary" as const,
        text: "KYC Pending",
        className: "cursor-pointer hover:opacity-80",
      };
    }

    const configs = {
      pending: {
        icon: Clock,
        variant: "secondary" as const,
        text: "KYC Under Review",
        className: "bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer",
      },
      verified: {
        icon: CheckCircle,
        variant: "default" as const,
        text: "KYC Verified",
        className: "bg-green-500 text-white hover:bg-green-600 cursor-pointer",
      },
      rejected: {
        icon: XCircle,
        variant: "destructive" as const,
        text: "KYC Rejected",
        className: "cursor-pointer hover:opacity-80",
      },
    };

    return configs[kycStatus as keyof typeof configs];
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={config.className}
      onClick={() => navigate("/kyc-verification")}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
};

export default KYCStatusBadge;

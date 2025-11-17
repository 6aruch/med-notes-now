import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Shield, Info } from "lucide-react";

const KYCVerification = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Form state
  const [documentType, setDocumentType] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setKycStatus(data);
    } catch (error: any) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate required fields
      if (!documentType || !documentNumber || !fullName || !dateOfBirth) {
        throw new Error("Please fill in all required fields");
      }

      const { error } = await supabase.from("kyc_documents").insert({
        user_id: user.id,
        document_type: documentType as any,
        document_number: documentNumber.trim(),
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
      });

      if (error) throw error;

      toast.success("KYC documents submitted successfully! Awaiting verification.");
      await fetchKycStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit KYC documents");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!kycStatus) return null;

    const statusConfig = {
      pending: { icon: Clock, color: "bg-yellow-500", text: "Pending Verification" },
      verified: { icon: CheckCircle, color: "bg-green-500", text: "Verified" },
      rejected: { icon: XCircle, color: "bg-red-500", text: "Rejected" },
    };

    const config = statusConfig[kycStatus.verification_status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  KYC Verification
                </CardTitle>
                <CardDescription>
                  Verify your identity for enhanced security and personalization
                </CardDescription>
              </div>
              {kycStatus && getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your personal information is encrypted and stored securely. We only collect what's necessary for identity verification.
              </AlertDescription>
            </Alert>

            {kycStatus ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Document Type</Label>
                    <p className="font-medium capitalize">
                      {kycStatus.document_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{kycStatus.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Document Number</Label>
                    <p className="font-medium">
                      {kycStatus.document_number.slice(0, 4)}****{kycStatus.document_number.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">
                      {new Date(kycStatus.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p className="font-medium">
                      {new Date(kycStatus.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {kycStatus.verified_at && (
                    <div>
                      <Label className="text-muted-foreground">Verified</Label>
                      <p className="font-medium">
                        {new Date(kycStatus.verified_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {kycStatus.verification_status === "rejected" && kycStatus.rejection_reason && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejection Reason:</strong> {kycStatus.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}

                {kycStatus.verification_status === "pending" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your documents are under review. This typically takes 1-2 business days.
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nin">National Identification Number (NIN)</SelectItem>
                      <SelectItem value="passport">International Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="voters_card">Voter's Card</SelectItem>
                      <SelectItem value="national_id">National ID Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name (as on document) *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-number">Document Number *</Label>
                  <Input
                    id="document-number"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter document number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">Date of Birth *</Label>
                  <Input
                    id="date-of-birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit KYC Documents"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KYCVerification;

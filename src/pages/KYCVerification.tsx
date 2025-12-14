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
import { z } from "zod";

// Validation schemas for different document types
const documentPatterns = {
  nin: /^[0-9]{11}$/, // NIN: 11 digits
  passport: /^[A-Z][0-9]{8}$/, // Passport: 1 letter + 8 digits
  drivers_license: /^[A-Z0-9]{10,12}$/, // Driver's license: 10-12 alphanumeric
  voters_card: /^[A-Z0-9]{19}$/, // Voter's card: 19 alphanumeric
  national_id: /^[A-Z0-9]{8,15}$/, // National ID: 8-15 alphanumeric
};

const documentFormatHints = {
  nin: "11 digits (e.g., 12345678901)",
  passport: "1 letter followed by 8 digits (e.g., A12345678)",
  drivers_license: "10-12 alphanumeric characters",
  voters_card: "19 alphanumeric characters",
  national_id: "8-15 alphanumeric characters",
};

// Calculate min date (150 years ago) and max date (18 years ago for adults, or today for all)
const getDateConstraints = () => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 150, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()); // At least 1 year old
  return { minDate, maxDate };
};

const createKycSchema = (documentType: string) => {
  const pattern = documentPatterns[documentType as keyof typeof documentPatterns] || /^[A-Z0-9]{5,50}$/;
  const { minDate, maxDate } = getDateConstraints();
  
  return z.object({
    documentType: z.enum(["nin", "passport", "drivers_license", "voters_card", "national_id"], {
      required_error: "Please select a document type",
    }),
    documentNumber: z.string()
      .trim()
      .min(5, "Document number must be at least 5 characters")
      .max(50, "Document number must not exceed 50 characters")
      .regex(/^[A-Z0-9]+$/i, "Document number must contain only letters and numbers")
      .refine((val) => pattern.test(val.toUpperCase()), {
        message: `Invalid format for this document type. Expected: ${documentFormatHints[documentType as keyof typeof documentFormatHints] || "alphanumeric"}`,
      }),
    fullName: z.string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .regex(/^[a-zA-Z\s\-'.]+$/, "Full name can only contain letters, spaces, hyphens, apostrophes, and periods"),
    dateOfBirth: z.string()
      .min(1, "Date of birth is required")
      .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid date format")
      .refine((val) => {
        const date = new Date(val);
        return date >= minDate && date <= maxDate;
      }, "Date of birth must be a valid date in the past"),
  });
};

const KYCVerification = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    } finally {
      setLoadingStatus(false);
    }
  };

  const validateForm = () => {
    if (!documentType) {
      setValidationErrors({ documentType: "Please select a document type" });
      return null;
    }

    const schema = createKycSchema(documentType);
    const result = schema.safeParse({
      documentType,
      documentNumber: documentNumber.toUpperCase(),
      fullName,
      dateOfBirth,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setValidationErrors(errors);
      return null;
    }

    setValidationErrors({});
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate with zod schema
      const validatedData = validateForm();
      if (!validatedData) {
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("kyc_documents").insert({
        user_id: user.id,
        document_type: validatedData.documentType as any,
        document_number: validatedData.documentNumber,
        full_name: validatedData.fullName,
        date_of_birth: validatedData.dateOfBirth,
      });

      if (error) throw error;

      toast.success("KYC documents submitted successfully! Awaiting verification.");
      await fetchKycStatus();
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
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
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (validationErrors.fullName) {
                        setValidationErrors(prev => ({ ...prev, fullName: "" }));
                      }
                    }}
                    placeholder="Enter your full name"
                    maxLength={100}
                    className={validationErrors.fullName ? "border-destructive" : ""}
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{fullName.length}/100 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-number">Document Number *</Label>
                  <Input
                    id="document-number"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value.toUpperCase());
                      if (validationErrors.documentNumber) {
                        setValidationErrors(prev => ({ ...prev, documentNumber: "" }));
                      }
                    }}
                    placeholder={documentType ? documentFormatHints[documentType as keyof typeof documentFormatHints] : "Select document type first"}
                    maxLength={50}
                    className={validationErrors.documentNumber ? "border-destructive" : ""}
                  />
                  {validationErrors.documentNumber && (
                    <p className="text-sm text-destructive">{validationErrors.documentNumber}</p>
                  )}
                  {documentType && (
                    <p className="text-xs text-muted-foreground">
                      Format: {documentFormatHints[documentType as keyof typeof documentFormatHints]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">Date of Birth *</Label>
                  <Input
                    id="date-of-birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (validationErrors.dateOfBirth) {
                        setValidationErrors(prev => ({ ...prev, dateOfBirth: "" }));
                      }
                    }}
                    max={new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    className={validationErrors.dateOfBirth ? "border-destructive" : ""}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-sm text-destructive">{validationErrors.dateOfBirth}</p>
                  )}
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

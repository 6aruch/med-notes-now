import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, Users, FileCheck, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendingDoctor {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  years_of_experience: number | null;
  bio: string | null;
  full_name: string;
  email: string;
  created_at: string;
}

interface PendingKYC {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string;
  full_name: string;
  date_of_birth: string | null;
  created_at: string;
  user_email: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedKYCId, setSelectedKYCId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    
    if (!authLoading && role && role !== "admin") {
      // Redirect non-admins to their appropriate dashboard
      if (role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    if (user && role === "admin") {
      fetchPendingItems();
    }
  }, [user, role]);

  const fetchPendingItems = async () => {
    try {
      // Fetch pending doctors
      const { data: doctorsData, error: doctorsError } = await supabase.rpc('get_pending_doctors');
      if (doctorsError) throw doctorsError;
      setPendingDoctors(doctorsData || []);

      // Fetch pending KYC
      const { data: kycData, error: kycError } = await supabase.rpc('get_pending_kyc');
      if (kycError) throw kycError;
      setPendingKYC(kycData || []);
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId: string, approve: boolean) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_doctor', {
        doctor_id: doctorId,
        should_approve: approve
      });

      if (error) throw error;

      toast.success(approve ? "Doctor approved successfully" : "Doctor rejected");
      setPendingDoctors(pendingDoctors.filter(d => d.id !== doctorId));
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessKYC = async (kycId: string, status: 'verified' | 'rejected', reason?: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('process_kyc', {
        kyc_id: kycId,
        new_status: status,
        reason: reason || null
      });

      if (error) throw error;

      toast.success(status === 'verified' ? "KYC verified successfully" : "KYC rejected");
      setPendingKYC(pendingKYC.filter(k => k.id !== kycId));
      setRejectionReason("");
      setSelectedKYCId(null);
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage doctor approvals and KYC verifications
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Doctor Approvals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDoctors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending KYC Verifications</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingKYC.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="doctors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="doctors">Doctor Approvals</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verifications</TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>Pending Doctor Approvals</CardTitle>
                <CardDescription>
                  Review and approve doctor registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDoctors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending doctor approvals
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingDoctors.map((doctor) => (
                      <Card key={doctor.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">
                              Dr. {doctor.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.email}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                                {doctor.specialization}
                              </span>
                              <span className="px-2 py-1 bg-muted text-muted-foreground rounded">
                                License: {doctor.license_number}
                              </span>
                              {doctor.years_of_experience && (
                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded">
                                  {doctor.years_of_experience} years exp.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Registered: {format(new Date(doctor.created_at), "PPP")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDoctor(doctor.id, true)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproveDoctor(doctor.id, false)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>Pending KYC Verifications</CardTitle>
                <CardDescription>
                  Review and verify user identity documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingKYC.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending KYC verifications
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingKYC.map((kyc) => (
                      <Card key={kyc.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">
                              {kyc.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {kyc.user_email}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                                {kyc.document_type.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-1 bg-muted text-muted-foreground rounded">
                                Doc #: {kyc.document_number}
                              </span>
                              {kyc.date_of_birth && (
                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded">
                                  DOB: {format(new Date(kyc.date_of_birth), "PP")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {format(new Date(kyc.created_at), "PPP")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleProcessKYC(kyc.id, 'verified')}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedKYCId(kyc.id)}
                                  disabled={isProcessing}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject KYC Document</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">Rejection Reason</Label>
                                    <Textarea
                                      id="reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Enter the reason for rejection..."
                                    />
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (selectedKYCId) {
                                        handleProcessKYC(selectedKYCId, 'rejected', rejectionReason);
                                      }
                                    }}
                                    disabled={isProcessing || !rejectionReason.trim()}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    Confirm Rejection
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;

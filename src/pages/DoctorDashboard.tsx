import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  patient_id: string;
  patients: {
    profiles: {
      full_name: string;
    };
  };
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role, isApproved } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Medical record form state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    
    if (!authLoading && role === "patient") {
      navigate("/dashboard");
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    try {
      // Get doctor ID
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (doctorError) throw doctorError;
      
      setDoctorId(doctorData.id);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          status,
          reason,
          patient_id,
          patients!inner (
            id,
            user_id,
            profiles!inner (
              full_name
            )
          )
        `)
        .eq("doctor_id", doctorData.id)
        .order("appointment_date", { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      
      toast.success("Appointment status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleCreateRecord = async () => {
    if (!selectedAppointment || !doctorId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("medical_records").insert({
        patient_id: selectedAppointment.patient_id,
        doctor_id: doctorId,
        appointment_id: selectedAppointment.id,
        diagnosis,
        prescription,
        notes,
      });

      if (error) throw error;

      // Update appointment status to completed
      await handleStatusUpdate(selectedAppointment.id, "completed");

      toast.success("Medical record created successfully");
      setSelectedAppointment(null);
      setDiagnosis("");
      setPrescription("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingAppointments = appointments.filter(
    (apt) => apt.status === "pending"
  );
  
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed"
  );

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

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">Account Pending Approval</h2>
                <p className="text-muted-foreground mt-2">
                  Your doctor account is pending admin approval. You will be able to access the system once your credentials have been verified.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This security measure ensures patient safety and data privacy. Please contact support if you have questions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Doctor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and patient records
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <Calendar className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{pendingAppointments.length}</h3>
            <p className="text-sm opacity-90">Pending Appointments</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-accent to-accent/80 p-6 text-accent-foreground">
            <Users className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{upcomingAppointments.length}</h3>
            <p className="text-sm opacity-90">Confirmed Appointments</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Pending Appointments
          </h2>
          {pendingAppointments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No pending appointments
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                        {appointment.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {format(new Date(appointment.appointment_date), "PPP")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.appointment_date), "p")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {appointment.patients.profiles.full_name}
                      </p>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(appointment.id, "confirmed")}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(appointment.id, "cancelled")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Confirmed Appointments
          </h2>
          {upcomingAppointments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No confirmed appointments
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        {appointment.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {format(new Date(appointment.appointment_date), "PPP")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.appointment_date), "p")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {appointment.patients.profiles.full_name}
                      </p>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason}
                      </p>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Add Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Medical Record</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            <Textarea
                              id="diagnosis"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              placeholder="Enter diagnosis..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prescription">Prescription</Label>
                            <Textarea
                              id="prescription"
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              placeholder="Enter prescription details..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Additional notes..."
                            />
                          </div>
                          <Button
                            onClick={handleCreateRecord}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            {isSubmitting ? "Creating..." : "Create Record"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;

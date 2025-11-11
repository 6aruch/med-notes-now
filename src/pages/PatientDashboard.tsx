import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  doctors: {
    specialization: string;
    profiles: {
      full_name: string;
    };
  };
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  prescription: string;
  created_at: string;
  doctors: {
    profiles: {
      full_name: string;
    };
  };
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    
    if (!authLoading && role === "doctor") {
      navigate("/doctor-dashboard");
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      // Get patient ID
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (patientError) throw patientError;
      
      setPatientId(patientData.id);

      // Fetch doctors
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          status,
          reason,
          doctor_id,
          doctors!inner (
            id,
            specialization,
            user_id,
            profiles!inner (
              full_name
            )
          )
        `)
        .eq("patient_id", patientData.id)
        .order("appointment_date", { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Fetch medical records
      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select(`
          id,
          diagnosis,
          prescription,
          created_at,
          doctors!inner (
            id,
            user_id,
            profiles!inner (
              full_name
            )
          )
        `)
        .eq("patient_id", patientData.id)
        .order("created_at", { ascending: false });

      if (recordsError) throw recordsError;
      setMedicalRecords(recordsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "pending" || apt.status === "confirmed"
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Patient Dashboard</h1>
            <Button onClick={() => navigate("/book-appointment")}>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage and track all your hospital appointments
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <Calendar className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{upcomingAppointments.length}</h3>
            <p className="text-sm opacity-90">Upcoming Appointments</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-accent to-accent/80 p-6 text-accent-foreground">
            <FileText className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{medicalRecords.length}</h3>
            <p className="text-sm opacity-90">Medical Records</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Upcoming Appointments
          </h2>
          {upcomingAppointments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No upcoming appointments
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
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
                        Dr. {appointment.doctors.profiles.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctors.specialization}
                      </p>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Medical Records
          </h2>
          {medicalRecords.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No medical records yet
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {medicalRecords.map((record) => (
                <Card key={record.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), "PP")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Dr. {record.doctors.profiles.full_name}
                      </p>
                    </div>
                    {record.diagnosis && (
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Diagnosis:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.diagnosis}
                        </p>
                      </div>
                    )}
                    {record.prescription && (
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Prescription:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.prescription}
                        </p>
                      </div>
                    )}
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

export default PatientDashboard;

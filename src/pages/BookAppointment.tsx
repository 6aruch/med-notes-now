import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Doctor {
  id: string;
  specialization: string;
  profiles: {
    full_name: string;
  };
}

const BookAppointment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDoctors();
      fetchPatientId();
    }
  }, [user]);

  const fetchPatientId = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setPatientId(data.id);
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(`
          id,
          specialization,
          profiles!inner (
            full_name
          )
        `)
        .eq("approved", true);

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: selectedDoctor,
        appointment_date: appointmentDateTime.toISOString(),
        reason,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Appointment booked successfully");
      navigate("/dashboard");
    } catch (error: any) {
      const { getUserFriendlyError } = await import("@/lib/errorHandler");
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  if (authLoading) {
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Book an Appointment</CardTitle>
            <CardDescription>
              Select a doctor, date, and time for your appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.profiles.full_name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Select Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookAppointment;

import Header from "@/components/Header";
import AppointmentCard from "@/components/AppointmentCard";
import { Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const upcomingAppointments = [
    {
      date: "March 15, 2024",
      time: "10:00 AM",
      doctor: "Dr. Sarah Johnson",
      department: "Cardiology Consultation",
      location: "Building A, Room 301",
      type: "upcoming" as const,
    },
    {
      date: "March 20, 2024",
      time: "2:30 PM",
      doctor: "Dr. Michael Chen",
      department: "General Check-up",
      location: "Building B, Room 105",
      type: "upcoming" as const,
    },
  ];

  const pastAppointments = [
    {
      date: "February 28, 2024",
      time: "11:00 AM",
      doctor: "Dr. Emily Williams",
      department: "Blood Test",
      location: "Laboratory, Level 2",
      type: "completed" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Your Dashboard</h1>
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">Manage and track all your hospital appointments</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <Calendar className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{upcomingAppointments.length}</h3>
            <p className="text-sm opacity-90">Upcoming Appointments</p>
          </div>
          
          <div className="rounded-xl bg-gradient-to-br from-accent to-accent/80 p-6 text-accent-foreground">
            <Calendar className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="text-2xl font-bold mb-1">{pastAppointments.length}</h3>
            <p className="text-sm opacity-90">Completed Visits</p>
          </div>
          
          <div className="rounded-xl bg-gradient-to-br from-secondary to-secondary/60 p-6">
            <Bell className="h-8 w-8 mb-3 text-secondary-foreground" />
            <h3 className="text-2xl font-bold mb-1 text-secondary-foreground">2</h3>
            <p className="text-sm text-secondary-foreground/80">Pending Notifications</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Upcoming Appointments</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAppointments.map((appointment, index) => (
              <AppointmentCard key={index} {...appointment} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Past Appointments</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastAppointments.map((appointment, index) => (
              <AppointmentCard key={index} {...appointment} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

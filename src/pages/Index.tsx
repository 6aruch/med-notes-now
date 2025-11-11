import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-medical.jpg";

const Index = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Calendar,
      title: "Track Appointments",
      description: "View all your upcoming and past hospital visits in one place",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Receive timely email alerts about your appointments and medical updates",
    },
    {
      icon: FileText,
      title: "Detailed Information",
      description: "Access complete details about each visit including doctor, time, and location",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your medical information is protected with enterprise-grade security",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative py-24 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  Your Health Journey,{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Simplified
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl">
                  Track your hospital visits, receive automated appointment notifications, and stay informed about your healthcare—all in one secure platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button asChild size="lg" className="text-base">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="text-base">
                      <Link to="/auth">Get Started</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <Link to="/auth">Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
              <img
                src={heroImage}
                alt="Modern medical facility"
                className="relative rounded-2xl shadow-2xl w-full object-cover h-[400px] lg:h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage your healthcare appointments efficiently
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-xl bg-card p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who trust HealthTrack to manage their hospital visits
            </p>
            <Button asChild size="lg" variant="secondary" className="text-base">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Go to Dashboard" : "Start Tracking Now"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

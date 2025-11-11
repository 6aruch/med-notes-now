import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppointmentCardProps {
  date: string;
  time: string;
  doctor: string;
  department: string;
  location: string;
  type: "upcoming" | "completed";
}

const AppointmentCard = ({ date, time, doctor, department, location, type }: AppointmentCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/80 border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">{department}</h3>
          <Badge variant={type === "upcoming" ? "default" : "secondary"} className="text-xs">
            {type === "upcoming" ? "Upcoming" : "Completed"}
          </Badge>
        </div>
        {type === "upcoming" && (
          <Button size="sm" variant="outline">View Details</Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <User className="h-4 w-4 text-primary" />
          <span>{doctor}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{location}</span>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;

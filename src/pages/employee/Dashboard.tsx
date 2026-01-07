import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  CreditCard,
  Play,
  Pause,
  LogIn,
  LogOut,
  MapPin,
  AlertCircle,
  Coffee,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";

interface GeolocationPosition {
  lat: number;
  lng: number;
}

// Set to null to disable geofencing
const OFFICE_LOCATION: { lat: number; lng: number } | null = null;
const GEOFENCE_RADIUS = 500;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const WORK_DAY_HOURS = 8;
const WORK_DAY_SECONDS = WORK_DAY_HOURS * 3600;

const recentActivity = [
  { type: "attendance", date: "Jan 6, 2026", status: "present", detail: "09:00 AM - 06:05 PM", hours: "9h 5m" },
  { type: "leave", date: "Jan 3, 2026", status: "approved", detail: "Casual Leave", days: "1 day" },
  { type: "attendance", date: "Jan 2, 2026", status: "present", detail: "09:15 AM - 06:00 PM", hours: "8h 45m", isLate: true },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (clockedIn && clockInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const totalElapsed = Math.floor((now.getTime() - clockInTime.getTime()) / 1000);
        setElapsedTime(totalElapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, clockInTime]);

  // Track break time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (onBreak) {
      interval = setInterval(() => {
        setBreakTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak]);

  const checkGeolocation = useCallback(() => {
    // If no office location configured, skip geofencing
    if (!OFFICE_LOCATION) {
      setIsWithinGeofence(true);
      setCheckingLocation(false);
      return;
    }

    setCheckingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        const distance = calculateDistance(
          latitude, longitude,
          OFFICE_LOCATION.lat, OFFICE_LOCATION.lng
        );
        
        setIsWithinGeofence(distance <= GEOFENCE_RADIUS);
        setCheckingLocation(false);
        
        if (distance > GEOFENCE_RADIUS) {
          setLocationError(`You are ${Math.round(distance)}m from office. Must be within ${GEOFENCE_RADIUS}m to clock in.`);
        }
      },
      (error) => {
        setCheckingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleClockIn = () => {
    // If geofencing is disabled, clock in directly
    if (!OFFICE_LOCATION) {
      setClockedIn(true);
      setClockInTime(new Date());
      toast.success("Clocked in successfully!");
      return;
    }
    checkGeolocation();
    setShowClockDialog(true);
  };

  const handleClockOut = () => {
    setClockedIn(false);
    setOnBreak(false);
    setClockInTime(null);
    setElapsedTime(0);
    setBreakTime(0);
    setTotalBreakTime(0);
    toast.success("Clocked out successfully!");
  };

  const confirmClockIn = () => {
    if (isWithinGeofence || !locationError) {
      setClockedIn(true);
      setClockInTime(new Date());
      setShowClockDialog(false);
      toast.success("Clocked in successfully!");
    }
  };

  const toggleBreak = () => {
    if (onBreak) {
      setTotalBreakTime(prev => prev + breakTime);
      setBreakTime(0);
      toast.info("Break ended. Welcome back!");
    } else {
      toast.info("Break started. Enjoy!");
    }
    setOnBreak(!onBreak);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeShort = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const workingTime = elapsedTime - totalBreakTime - (onBreak ? breakTime : 0);
  const progressPercent = Math.min((workingTime / WORK_DAY_SECONDS) * 100, 100);
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Minimal Greeting */}
      <div className="text-center pt-4">
        <p className="text-muted-foreground text-sm">
          {dateString}
        </p>
        <h1 className="text-2xl font-display font-bold mt-1">
          Hello, {user?.name.split(' ')[0]}
        </h1>
      </div>

      {/* Circular Clock Card with Progress Ring */}
      <div className="flex justify-center py-6">
        <div className="relative">
          {/* SVG Progress Ring */}
          <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
            {/* Background Circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              strokeWidth="8"
              className="stroke-border"
            />
            {/* Progress Circle */}
            {clockedIn && (
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000",
                  onBreak ? "stroke-warning" : "stroke-primary"
                )}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            )}
          </svg>

          {/* Inner Content - Positioned absolutely in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-52 h-52 rounded-full flex items-center justify-center transition-all duration-300",
              clockedIn 
                ? onBreak 
                  ? "bg-warning/5" 
                  : "bg-primary/5"
                : "bg-card"
            )}>
              <div className="text-center space-y-2">
                {clockedIn ? (
                  <>
                    {/* Status */}
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                      onBreak 
                        ? "bg-warning/20 text-warning-foreground" 
                        : "bg-primary/20 text-primary"
                    )}>
                      {onBreak ? <Coffee className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {onBreak ? "On Break" : "Working"}
                    </div>
                    
                    {/* Timer */}
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {formatTime(elapsedTime)}
                    </p>
                    
                    {/* Progress */}
                    <p className="text-xs text-muted-foreground">
                      {Math.round(progressPercent)}% of {WORK_DAY_HOURS}h completed
                    </p>

                    {/* Clock In Time */}
                    <p className="text-xs text-muted-foreground">
                      Since {clockInTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-base font-medium text-muted-foreground">
                      Not Clocked In
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tap to start
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Break Button */}
          {clockedIn && (
            <Button
              onClick={toggleBreak}
              size="icon"
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110",
                onBreak 
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                  : "bg-warning hover:bg-warning/90 text-warning-foreground"
              )}
            >
              {onBreak ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        {clockedIn ? (
          <Button
            onClick={handleClockOut}
            variant="outline"
            className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4" />
            Clock Out
          </Button>
        ) : (
          <Button
            onClick={handleClockIn}
            className="gap-2 gradient-primary text-primary-foreground px-8"
          >
            <LogIn className="h-4 w-4" />
            Clock In
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        <Link to="/employee/attendance">
          <Card className="hrms-card hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">18</p>
              <p className="text-xs text-muted-foreground">Days Present</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/employee/leave">
          <Card className="hrms-card hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">32</p>
              <p className="text-xs text-muted-foreground">Leaves Left</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/employee/payroll">
          <Card className="hrms-card hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">₹85K</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="hrms-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  activity.type === "attendance" 
                    ? "bg-primary/10" 
                    : "bg-success/10"
                )}>
                  {activity.type === "attendance" ? (
                    <Clock className="h-4 w-4 text-primary" />
                  ) : (
                    <Calendar className="h-4 w-4 text-success" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.date}</p>
                  <p className="text-xs text-muted-foreground">{activity.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activity.isLate && <StatusBadge variant="late" />}
                {activity.type === "attendance" ? (
                  <StatusBadge variant={activity.status as "present" | "absent"} />
                ) : (
                  <StatusBadge variant={activity.status as "approved" | "pending" | "rejected"} />
                )}
                {activity.hours && (
                  <span className="text-xs font-medium text-primary ml-1">
                    {activity.hours}
                  </span>
                )}
                {activity.days && (
                  <span className="text-xs font-medium text-muted-foreground ml-1">
                    {activity.days}
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Geofencing Dialog - Only shown if geofencing is enabled */}
      {OFFICE_LOCATION && (
        <Dialog open={showClockDialog} onOpenChange={setShowClockDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location Verification
              </DialogTitle>
              <DialogDescription>
                Verifying your location before clock in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {checkingLocation ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Checking location...</p>
                </div>
              ) : locationError ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">{locationError}</p>
                  <Button onClick={checkGeolocation} variant="outline" size="sm">
                    Retry
                  </Button>
                </div>
              ) : isWithinGeofence ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-sm text-center text-success font-medium">
                    Location verified!
                  </p>
                  {currentLocation && (
                    <p className="text-xs text-muted-foreground">
                      {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button onClick={checkGeolocation} variant="outline">
                    Check Location
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowClockDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={!isWithinGeofence || checkingLocation}
                onClick={confirmClockIn}
              >
                Clock In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

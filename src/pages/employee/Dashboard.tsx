import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { Link } from "react-router-dom";

interface GeolocationPosition {
  lat: number;
  lng: number;
}

// Office location (mock - you would configure this in settings)
const OFFICE_LOCATION = { lat: 28.6139, lng: 77.2090 }; // Delhi
const GEOFENCE_RADIUS = 500; // meters

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

  // Update elapsed time every second (continues during break)
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
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
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

      {/* Circular Clock Card */}
      <div className="flex justify-center py-6">
        <div className="relative">
          {/* Outer Ring */}
          <div className={cn(
            "w-64 h-64 rounded-full border-4 flex items-center justify-center transition-all duration-500",
            clockedIn 
              ? onBreak 
                ? "border-warning bg-warning/5" 
                : "border-primary bg-primary/5"
              : "border-border bg-card"
          )}>
            {/* Inner Content */}
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
                  <p className="text-4xl font-mono font-bold text-foreground">
                    {formatTime(elapsedTime)}
                  </p>
                  
                  {/* Working Time */}
                  <p className="text-xs text-muted-foreground">
                    Working: {formatTimeShort(workingTime)}
                  </p>

                  {/* Clock In Time */}
                  <p className="text-xs text-muted-foreground">
                    Since {clockInTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              ) : (
                <>
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Not Clocked In
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tap to start your day
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Break Button - Positioned on the right */}
          {clockedIn && (
            <Button
              onClick={toggleBreak}
              size="icon"
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 rounded-full shadow-lg",
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

      {/* Geofencing Dialog */}
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
    </div>
  );
}

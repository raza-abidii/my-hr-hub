import { useState, useEffect, useCallback } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, Home, Clock, Calendar, CreditCard, Users, Play, Pause, MapPin, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const bottomNavItems = [
  { title: "Home", href: "/employee", icon: Home },
  { title: "Attendance", href: "/employee/attendance", icon: Clock },
  { title: "Leave", href: "/employee/leave", icon: Calendar },
  { title: "Payroll", href: "/employee/payroll", icon: CreditCard },
  { title: "Directory", href: "/employee/directory", icon: Users },
];

interface GeolocationPosition {
  lat: number;
  lng: number;
}

// Office location (mock - you would configure this in settings)
const OFFICE_LOCATION = { lat: 28.6139, lng: 77.2090 }; // Delhi
const GEOFENCE_RADIUS = 500; // meters

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
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

export function EmployeeLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (clockedIn && clockInTime && !onBreak) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - clockInTime.getTime()) / 1000) - breakTime;
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, clockInTime, onBreak, breakTime]);

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

  const handleClockAction = () => {
    if (!clockedIn) {
      checkGeolocation();
      setShowClockDialog(true);
    } else {
      // Clock out
      setClockedIn(false);
      setOnBreak(false);
      setClockInTime(null);
      setElapsedTime(0);
      setBreakTime(0);
      toast.success("Clocked out successfully!");
    }
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
      toast.info("Break ended. Timer resumed.");
    } else {
      toast.info("Break started. Timer paused.");
    }
    setOnBreak(!onBreak);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (href: string) => {
    if (href === "/employee") return location.pathname === "/employee";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">SF</span>
          </div>
          <span className="font-display font-bold text-lg">SFON HRMS</span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/employee/notifications">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </Link>
          <Link to="/employee/profile">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">
                {user?.name.charAt(0)}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Clock-in Status Bar */}
      {clockedIn && (
        <div className={cn(
          "px-4 py-2 flex items-center justify-between text-sm",
          onBreak ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success-foreground"
        )}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {onBreak ? "On Break" : "Working"}: {formatTime(elapsedTime)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBreak}
            className="h-7 gap-1"
          >
            {onBreak ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {onBreak ? "Resume" : "Break"}
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto pb-24">
        <Outlet />
      </main>

      {/* Clock In/Out Button (Floating) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={handleClockAction}
          className={cn(
            "h-14 px-6 rounded-full shadow-lg font-semibold text-base",
            clockedIn 
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
              : "gradient-primary text-primary-foreground"
          )}
        >
          <Clock className="h-5 w-5 mr-2" />
          {clockedIn ? "Clock Out" : "Clock In"}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-30">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Geofencing Dialog */}
      <Dialog open={showClockDialog} onOpenChange={setShowClockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Clock In - Location Verification
            </DialogTitle>
            <DialogDescription>
              Your location must be verified before clocking in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {checkingLocation ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Checking your location...</p>
              </div>
            ) : locationError ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-sm text-center text-muted-foreground">{locationError}</p>
                <Button onClick={checkGeolocation} variant="outline" size="sm">
                  Retry Location Check
                </Button>
              </div>
            ) : isWithinGeofence ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-center text-success font-medium">
                  Location verified! You are within office premises.
                </p>
                {currentLocation && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Click "Check Location" to verify your position
                </p>
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
              Confirm Clock In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

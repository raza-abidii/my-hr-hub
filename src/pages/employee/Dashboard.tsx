import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  Clock,
  Calendar,
  CreditCard,
  CheckCircle2,
  LogIn,
  LogOut,
} from "lucide-react";

const recentAttendance = [
  { date: "Jan 6, 2026", day: "Mon", clockIn: "09:00 AM", clockOut: "06:05 PM", hours: "9h 5m", status: "present" as const },
  { date: "Jan 5, 2026", day: "Sun", clockIn: "-", clockOut: "-", hours: "-", status: "weekend" as const },
  { date: "Jan 4, 2026", day: "Sat", clockIn: "-", clockOut: "-", hours: "-", status: "weekend" as const },
  { date: "Jan 3, 2026", day: "Fri", clockIn: "09:15 AM", clockOut: "06:00 PM", hours: "8h 45m", status: "present" as const, isLate: true },
];

const leaveBalance = [
  { type: "Casual Leave", used: 2, total: 12, color: "bg-blue-500" },
  { type: "Sick Leave", used: 1, total: 10, color: "bg-purple-500" },
  { type: "Earned Leave", used: 5, total: 18, color: "bg-primary" },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Good morning, ${user?.name.split(' ')[0]}!`}
        subtitle="Here's your work summary for today."
      />

      {/* Today's Status Card */}
      <Card className="gradient-card text-primary-foreground overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">
                Today's Status
              </p>
              <p className="text-2xl font-display font-bold mt-1">
                January 7, 2026 • Tuesday
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm">Clock In: 09:02 AM</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Clock Out: --:--</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/20 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Currently Working</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Days Present"
          value="18"
          icon={Clock}
          variant="success"
        />
        <StatCard
          title="Days Absent"
          value="1"
          icon={Calendar}
          variant="danger"
        />
        <StatCard
          title="Leaves Available"
          value="32"
          icon={Calendar}
          variant="info"
        />
        <StatCard
          title="This Month Salary"
          value="₹85,000"
          icon={CreditCard}
          variant="default"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <Card className="hrms-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAttendance.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">
                    {record.date} <span className="text-muted-foreground">({record.day})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.status !== 'weekend' ? `${record.clockIn} - ${record.clockOut}` : 'No attendance'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {record.isLate && <StatusBadge variant="late" />}
                  <StatusBadge variant={record.status} />
                  {record.hours !== '-' && (
                    <span className="text-sm font-semibold text-primary ml-2">
                      {record.hours}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card className="hrms-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaveBalance.map((leave) => (
              <div key={leave.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{leave.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {leave.total - leave.used} of {leave.total} remaining
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${leave.color} rounded-full transition-all`}
                    style={{ width: `${((leave.total - leave.used) / leave.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <button className="w-full text-sm text-primary font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors mt-2">
              Apply for Leave →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

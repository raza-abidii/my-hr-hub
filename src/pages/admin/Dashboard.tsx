import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const recentLeaveRequests = [
  { id: 1, name: "John Doe", type: "Casual Leave", dates: "Jan 8-9", status: "pending" as const },
  { id: 2, name: "Jane Smith", type: "Sick Leave", dates: "Jan 7", status: "approved" as const },
  { id: 3, name: "Mike Johnson", type: "Earned Leave", dates: "Jan 10-15", status: "pending" as const },
];

const todayAttendance = [
  { id: 1, name: "Sarah Wilson", department: "IT", time: "09:02 AM", status: "present" as const },
  { id: 2, name: "Tom Brown", department: "HR", time: "09:15 AM", status: "late" as const },
  { id: 3, name: "Emily Davis", department: "Finance", time: "-", status: "absent" as const },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value="156"
          icon={Users}
          trend={{ value: 5.2, isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Present Today"
          value="142"
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Absent Today"
          value="8"
          icon={UserX}
          variant="danger"
        />
        <StatCard
          title="Pending Leaves"
          value="12"
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <Card className="hrms-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeaveRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{request.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.type} • {request.dates}
                  </p>
                </div>
                <StatusBadge variant={request.status} />
              </div>
            ))}
            <button className="w-full text-sm text-primary font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors">
              View All Requests →
            </button>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="hrms-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {record.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{record.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.department} • {record.time}
                    </p>
                  </div>
                </div>
                <StatusBadge variant={record.status} />
              </div>
            ))}
            <button className="w-full text-sm text-primary font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors">
              View Full Report →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hrms-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Add Employee", icon: Users },
              { label: "Approve Leaves", icon: Calendar },
              { label: "Run Payroll", icon: TrendingUp },
              { label: "View Reports", icon: Clock },
            ].map((action) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <action.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

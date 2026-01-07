import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  approverComment?: string;
}

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    type: "Casual Leave",
    fromDate: "Jan 15, 2026",
    toDate: "Jan 16, 2026",
    days: 2,
    reason: "Personal work",
    status: "pending",
    appliedDate: "Jan 7, 2026",
  },
  {
    id: "2",
    type: "Sick Leave",
    fromDate: "Dec 20, 2025",
    toDate: "Dec 20, 2025",
    days: 1,
    reason: "Not feeling well",
    status: "approved",
    appliedDate: "Dec 19, 2025",
    approverComment: "Get well soon!",
  },
  {
    id: "3",
    type: "Earned Leave",
    fromDate: "Nov 10, 2025",
    toDate: "Nov 15, 2025",
    days: 5,
    reason: "Family vacation",
    status: "approved",
    appliedDate: "Oct 25, 2025",
  },
  {
    id: "4",
    type: "Casual Leave",
    fromDate: "Oct 5, 2025",
    toDate: "Oct 5, 2025",
    days: 1,
    reason: "Personal emergency",
    status: "rejected",
    appliedDate: "Oct 4, 2025",
    approverComment: "Team has critical deadline. Please reschedule.",
  },
];

const leaveBalance = [
  { type: "Casual Leave", code: "CL", used: 2, total: 12 },
  { type: "Sick Leave", code: "SL", used: 1, total: 10 },
  { type: "Earned Leave", code: "EL", used: 5, total: 18 },
  { type: "Compensatory Off", code: "CO", used: 0, total: 2 },
];

const leaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave", "Compensatory Off"];

export default function LeaveManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Leave Applied!",
      description: "Your leave request has been submitted for approval.",
    });

    setIsDialogOpen(false);
    setFormData({ leaveType: "", fromDate: "", toDate: "", reason: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave Management"
        subtitle="Apply for and track your leaves"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Apply for Leave</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Leave Type *</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, leaveType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date *</Label>
                    <Input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) =>
                        setFormData({ ...formData, fromDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date *</Label>
                    <Input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) =>
                        setFormData({ ...formData, toDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    placeholder="Enter reason for leave"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary">
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalance.map((leave) => (
          <Card key={leave.code} className="hrms-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {leave.type}
                  </p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {leave.total - leave.used}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {leave.total} remaining
                  </p>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                  {leave.code}
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${((leave.total - leave.used) / leave.total) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave History */}
      <Card className="hrms-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {mockLeaveRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{request.type}</span>
                      <StatusBadge variant={request.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {request.fromDate} - {request.toDate} ({request.days} day
                      {request.days > 1 ? "s" : ""})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reason: {request.reason}
                    </p>
                    {request.approverComment && (
                      <p className="text-sm text-primary mt-2 italic">
                        "{request.approverComment}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Applied on {request.appliedDate}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

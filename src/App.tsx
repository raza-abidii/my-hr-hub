import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AddEmployee from "./pages/admin/AddEmployee";
import EmployeeMaster from "./pages/admin/masters/EmployeeMaster";
import DepartmentMaster from "./pages/admin/masters/DepartmentMaster";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import MyAttendance from "./pages/employee/MyAttendance";
import LeaveManagement from "./pages/employee/LeaveManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="add-employee" element={<AddEmployee />} />
              <Route path="masters/employee" element={<EmployeeMaster />} />
              <Route path="masters/department" element={<DepartmentMaster />} />
            </Route>

            {/* Employee Routes */}
            <Route path="/employee" element={<AppLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="leave" element={<LeaveManagement />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

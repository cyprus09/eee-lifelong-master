import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Edit, Trash2, Search, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { supabase } from "../../lib/supabaseClient";

const UserManagementDashboard = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [batchYearFilter, setBatchYearFilter] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // User CRUD state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    role: "student",
    batch_year: "",
    notification_preferences: {
      events_enabled: true,
      event_types: ["workshop", "social", "academic", "career"],
      email_frequency: "immediate",
    },
  });

  // User notification preferences modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    events_enabled: true,
    event_types: [],
    email_frequency: "immediate",
  });

  // Batch years and roles for filtering
  const [batchYears, setBatchYears] = useState([]);
  const roles = ["student", "student leader", "admin"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Event types for notification preferences
  const eventTypes = ["workshop", "social", "academic", "career"];
  const emailFrequencies = ["immediate", "daily", "weekly"];

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever filter conditions change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, batchYearFilter, users]);

  // Extract unique batch years when users are available
  useEffect(() => {
    if (users.length > 0) {
      const years = [...new Set(users.map(user => user.batch_year).filter(Boolean))];
      setBatchYears(years.sort((a, b) => b - a)); // Sort in descending order
    }
  }, [users]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`http://localhost:8080/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update a user's profile
  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const updatedUser = await response.json();

      setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? updatedUser : user)));

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update a user's notification preferences
  const updateNotificationPreferences = async (userId, preferences) => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/notifications`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_preferences: preferences }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update notification preferences");
      }

      const updatedUser = await response.json();

      setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? updatedUser : user)));

      return updatedUser;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the users list
  const applyFilters = () => {
    if (!users.length) return;

    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter && roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (batchYearFilter && batchYearFilter !== "all") {
      const year = parseInt(batchYearFilter);
      filtered = filtered.filter(user => user.batch_year === year);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle user form input changes
  const handleUserFormChange = e => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value,
    });
  };

  // Open modal for editing a user
  const handleEditUser = user => {
    setCurrentUser(user);
    setUserFormData({
      username: user.username || "",
      role: user.role || "student",
      batch_year: user.batch_year ? user.batch_year.toString() : "2025",
      notification_preferences: user.notification_preferences || {
        events_enabled: true,
        event_types: ["workshop", "social", "academic", "career"],
        email_frequency: "immediate",
      },
    });
    setIsUserModalOpen(true);
  };

  // Open notification preferences modal
  const handleEditNotifications = user => {
    setCurrentUser(user);
    setNotificationSettings(
      user.notification_preferences || {
        events_enabled: true,
        event_types: ["workshop", "social", "academic", "career"],
        email_frequency: "immediate",
      }
    );
    setIsNotificationModalOpen(true);
  };

  // Handle notification toggle
  const handleNotificationToggle = type => {
    if (type === "events_enabled") {
      setNotificationSettings({
        ...notificationSettings,
        events_enabled: !notificationSettings.events_enabled,
      });
    } else {
      // For event types (workshop, social, etc.)
      let updatedTypes = [...(notificationSettings.event_types || [])];

      if (updatedTypes.includes(type)) {
        // Remove type
        updatedTypes = updatedTypes.filter(t => t !== type);
      } else {
        // Add type
        updatedTypes.push(type);
      }

      setNotificationSettings({
        ...notificationSettings,
        event_types: updatedTypes,
      });
    }
  };

  // Save notification preferences
  const handleSaveNotifications = async () => {
    try {
      await updateNotificationPreferences(currentUser.id, notificationSettings);
      setIsNotificationModalOpen(false);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      alert(`Failed to save notification preferences: ${error.message}`);
    }
  };

  // Save user changes
  const handleSaveUser = async () => {
    // Validate form
    if (!userFormData.username || !userFormData.role) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const processedData = {
        username: userFormData.username,
        role: userFormData.role,
        batch_year: userFormData.batch_year ? parseInt(userFormData.batch_year, 10) : null,
        notification_preferences: userFormData.notification_preferences,
      };

      await updateUser(currentUser.id, processedData);
      setIsUserModalOpen(false);

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Failed to save user: ${error.message}`);
    }
  };

  // Disable a user (soft delete)
  const handleDisableUser = async userId => {
    if (window.confirm("Are you sure you want to disable this user? This will revoke their access to the system.")) {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error("No active session");
        }

        const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/disable`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to disable user");
        }

        // Update the user list to reflect the disabled user
        setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === userId) {
              return { ...user, disabled: true };
            }
            return user;
          })
        );

        alert("User has been disabled successfully");
      } catch (error) {
        console.error("Error disabling user:", error);
        alert(`Failed to disable user: ${error.message}`);
      }
    }
  };

  // Reset all filters
  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setBatchYearFilter("");
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Summary statistics for the dashboard
  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      description: "Active accounts",
    },
    {
      title: "Students",
      value: users.filter(user => user.role === "student").length,
      icon: Users,
      description: "Enrolled students",
    },
    {
      title: "Student Leaders",
      value: users.filter(user => user.role === "student leader").length,
      icon: Users,
      description: "Student representatives",
    },
    {
      title: "Admins",
      value: users.filter(user => user.role === "admin").length,
      icon: Shield,
      description: "System administrators",
    },
  ];

  // Get appropriate badge color based on user role
  const getRoleBadgeColor = role => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "student leader":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date with time
  const formatDateTime = dateString => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid date" : format(date, "PPpp");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-600">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="student-leaders">Student Leaders</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="all-users">
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-1/3">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={batchYearFilter} onValueChange={setBatchYearFilter}>
                    <SelectTrigger className="w-full md:w-1/3">
                      <SelectValue placeholder="Batch Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {batchYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-medium">Username</th>
                      <th className="p-3 text-left font-medium">Email</th>
                      <th className="p-3 text-left font-medium">Role</th>
                      <th className="p-3 text-left font-medium">Batch Year</th>
                      <th className="p-3 text-left font-medium">Last Updated</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{user.username || "N/A"}</td>
                          <td className="p-3">{user.email || "N/A"}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="p-3">{user.batch_year || "N/A"}</td>
                          <td className="p-3">{formatDateTime(user.updated_at)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditNotifications(user)}>
                                <Bell className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDisableUser(user.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-3 text-center">
                          {loading ? "Loading users..." : "No users found with the current filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {filteredUsers.length > usersPerPage && (
                  <div className="p-3 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                          // Show pages around current page
                          let pageNum;
                          if (totalPages <= 5) {
                            // If less than 5 pages, show all
                            pageNum = index + 1;
                          } else if (currentPage <= 3) {
                            // At the beginning
                            pageNum = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // At the end
                            pageNum = totalPages - 4 + index;
                          } else {
                            // In the middle
                            pageNum = currentPage - 2 + index;
                          }

                          return (
                            <PaginationItem key={index}>
                              <PaginationLink
                                isActive={currentPage === pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Accounts</CardTitle>
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtered view for students only */}
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-medium">Username</th>
                      <th className="p-3 text-left font-medium">Email</th>
                      <th className="p-3 text-left font-medium">Batch Year</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user => user.role === "student").length > 0 ? (
                      users
                        .filter(user => user.role === "student")
                        .filter(
                          user =>
                            !searchTerm ||
                            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{user.username || "N/A"}</td>
                            <td className="p-3">{user.email || "N/A"}</td>
                            <td className="p-3">{user.batch_year || "N/A"}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditNotifications(user)}>
                                  <Bell className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDisableUser(user.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-3 text-center">
                          No administrator accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Edit Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={userFormData.username}
                onChange={handleUserFormChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={userFormData.role}
                onValueChange={value => setUserFormData({ ...userFormData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch_year" className="text-right">
                Batch Year
              </Label>
              <Input
                id="batch_year"
                name="batch_year"
                type="number"
                value={userFormData.batch_year}
                onChange={handleUserFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Preferences Modal */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="events_enabled" className="mr-2">
                Event Notifications
              </Label>
              <Switch
                id="events_enabled"
                checked={notificationSettings.events_enabled}
                onCheckedChange={() => handleNotificationToggle("events_enabled")}
              />
            </div>

            <div className="space-y-2">
              <Label>Event Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Switch
                      id={`event_type_${type}`}
                      checked={notificationSettings.event_types?.includes(type)}
                      onCheckedChange={() => handleNotificationToggle(type)}
                      disabled={!notificationSettings.events_enabled}
                    />
                    <Label htmlFor={`event_type_${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_frequency">Email Frequency</Label>
              <Select
                value={notificationSettings.email_frequency}
                onValueChange={value =>
                  setNotificationSettings({
                    ...notificationSettings,
                    email_frequency: value,
                  })
                }
                disabled={!notificationSettings.events_enabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  {emailFrequencies.map(frequency => (
                    <SelectItem key={frequency} value={frequency}>
                      {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotifications}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementDashboard;

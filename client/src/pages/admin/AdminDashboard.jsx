import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import RoomManagementDashboard from "./RoomManagementDashboard";
import UserManagementDashboard from "./UserManagementDashboard";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-6 my-auto py-8 px-4 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Administration Dashboard</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Rooms</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <RoomManagementDashboard />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementDashboard />
          </TabsContent>

          <TabsContent value="events">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold">Event Management</h2>
              <p className="text-gray-500 mt-2">
                Event management functionality is implemented elsewhere in the application.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

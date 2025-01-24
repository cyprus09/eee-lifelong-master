import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, GraduationCap, Calendar, Activity } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const AdminDashboard = () => {
  // Sample data
  const activityData = [
    { month: "Jan", users: 120, events: 8, engagement: 75 },
    { month: "Feb", users: 150, events: 12, engagement: 82 },
    { month: "Mar", users: 180, events: 15, engagement: 88 },
    { month: "Apr", users: 220, events: 10, engagement: 85 },
    { month: "May", users: 250, events: 14, engagement: 90 },
  ];

  const stats = [
    {
      title: "Total Users",
      value: "2,834",
      icon: Users,
      description: "↗ 340 from last month",
    },
    {
      title: "Alumni",
      value: "1,245",
      icon: GraduationCap,
      description: "↗ 180 from last month",
    },
    {
      title: "Events Hosted",
      value: "59",
      icon: Calendar,
      description: "Past 12 months",
    },
    {
      title: "Active Users",
      value: "78%",
      icon: Activity,
      description: "↗ 12% from last month",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-8 my-auto py-8 px-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Growth Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" />
                      <Line type="monotone" dataKey="events" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="engagement" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Most Active Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>2021-2025</span>
                          <span className="font-bold">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2020-2024</span>
                          <span className="font-bold">72%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2019-2023</span>
                          <span className="font-bold">68%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Event Participation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Technical</span>
                          <span className="font-bold">45%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Social</span>
                          <span className="font-bold">30%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Career</span>
                          <span className="font-bold">25%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics">
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">User Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Students</span>
                          <span className="font-bold">60%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alumni</span>
                          <span className="font-bold">35%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Faculty</span>
                          <span className="font-bold">5%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Alumni by Industry</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Tech</span>
                          <span className="font-bold">45%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Finance</span>
                          <span className="font-bold">25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Research</span>
                          <span className="font-bold">20%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-bold">10%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

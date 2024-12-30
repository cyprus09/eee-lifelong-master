import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "@/components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Users, GraduationCap, BookOpen, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CarouselSlides from "@/components/common/CarouselSlides";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  // Mock data - replace with real data from your backend
  const userProfile = {
    name: user?.user_metadata?.full_name || "User Name",
    batch: "2021-2025",
    course: "Electrical Engineering",
    friends: 234,
    avatar: user?.user_metadata?.avatar_url,
  };

  const upcomingEvents = [
    {
      id: 1,
      title: "Batch Reunion",
      date: "2024-11-20",
      type: "Social",
    },
    {
      id: 2,
      title: "Career Workshop",
      date: "2024-11-25",
      type: "Career",
    },
    {
      id: 3,
      title: "Alumni Meet",
      date: "2024-12-01",
      type: "Social",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex-1 container mx-auto py-6 gap-6 flex mt-4">
        {/* Left Sidebar - User Profile */}
        <div className="hidden md:flex flex-col gap-6 w-64">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback>
                    {userProfile.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.batch}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Friends</span>
                  </div>
                  <Badge variant="secondary">{userProfile.friends}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>Batch</span>
                  </div>
                  <span className="text-sm">{userProfile.batch}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Course</span>
                  </div>
                  <span className="text-sm ml-12">{userProfile.course}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <CarouselSlides />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Calendar & Events */}
        <div className="hidden lg:flex flex-col gap-6 w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                    <Badge>{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;

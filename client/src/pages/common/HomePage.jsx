import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "@/components/common/Navbar";
import Footer from "../../components/common/Footer";
import AddEventForm from "../leader/AddEventForm";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Users, GraduationCap, BookOpen, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CarouselSlides from "@/components/common/CarouselSlides";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const HomePage = () => {
  const { user, userRole, hasRole, isStudentLeader } = useAuth();
  const [date, setDate] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initPage = async () => {
      console.log("HomePage initialized with:", {
        userId: user?.id,
        userRole,
        hasStudentLeaderAccess: hasRole("student_leader"),
      });

      await fetchUpcomingEvents();
    };

    if (user) {
      initPage();
    }
  }, [user, userRole]);

    // Handle event creation
    const handleSubmit = async eventData => {
      try {
        const session = await supabase.auth.getSession();
        const response = await fetch("http://localhost:8080/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            ...eventData,
            status: "upcoming",
            venue: selectedRoom?.name || eventData.venue,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create event");
        }
  
        setIsAddEventOpen(false);
  
        toast({
          title: "Success!",
          description: "Event created successfully.",
        });
      } catch (error) {
        console.error("Error creating event:", error);
        toast({
          title: "Event creation failed",
          description: "There was a problem creating the event. Please try again.",
        });
      }
    };

  const fetchUpcomingEvents = async () => {
    setIsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const url = `http://localhost:8080/api/events`;
      console.log("Fetching all events from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      // console.log(session.data.session.access_token);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const userProfile = {
    name: user?.user_metadata?.full_name || "User Name",
    batch: user?.user_metadata?.batch || "2021-2025",
    course: user?.user_metadata?.course || "Electrical Engineering",
    friends: user?.user_metadata?.friends_count || 0,
    avatar: user?.user_metadata?.avatar_url,
    role: userRole,
  };

  const getEventTypeColor = type => {
    const colors = {
      Social: "bg-blue-100 text-blue-800",
      Career: "bg-green-100 text-green-800",
      Academic: "bg-purple-100 text-purple-800",
      Cultural: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-200 text-gray-800";
  };

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
                      ?.split(" ")
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.batch}</p>
                  {userProfile.role && (
                    <Badge className="mt-2" variant="outline">
                      {userProfile.role}
                    </Badge>
                  )}
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
          {userRole === "student_leader" && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <div className="flex gap-4">
                    <Button onClick={() => setIsAddEventOpen(true)}>
                      <Plus className="h-4 w-3 mr-2" />
                      Create Event
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/events")}>
                      Manage Events
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Upcoming Events</span>
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate("/events")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p>Loading events...</p>
                ) : upcomingEvents?.length > 0 ? (
                  upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.date
                            ? isNaN(new Date(event.date.replace(" ", "T")).getTime())
                              ? "Invalid Date"
                              : new Date(event.date.replace(" ", "T")).toLocaleDateString()
                            : "Date Not Available"}
                        </p>
                      </div>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                    </div>
                  ))
                ) : (
                  <p>No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isStudentLeader() && (
        <AddEventForm isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSubmit={handleSubmit} />
      )}

      <Footer />
    </div>
  );
};

export default HomePage;

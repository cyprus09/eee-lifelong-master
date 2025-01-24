import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import AddEventForm from "../leader/AddEventForm";
import { Plus } from "lucide-react";
import RegisterDialog from "../../components/common/RegisterDialog";
import { supabase } from "../../lib/supabaseClient";

const EventsPage = () => {
  const { user, userRole, isStudentLeader } = useAuth();
  const [events, setEvents] = useState([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Fetch events from the server
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${await supabase.auth.getSession().then(({ data }) => data.session.access_token)}`,
        },
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleRegister = async eventId => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await supabase.auth.getSession().then(({ data }) => data.session.access_token)}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      fetchEvents(); // Refresh the events list
      setIsRegisterDialogOpen(false);
    } catch (error) {
      console.error("Error registering for event:", error);
    }
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
      <div className="max-w-7xl px-4 py-8 mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* Left Column - Calendar and Filters */}
          <div className="w-full md:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={getEventTypeColor("Social")}>Social</Badge>
                  <Badge className={getEventTypeColor("Career")}>Career</Badge>
                  <Badge className={getEventTypeColor("Academic")}>Academic</Badge>
                  <Badge className={getEventTypeColor("Cultural")}>Cultural</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events List */}
          <div className="flex-1 mb-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                  <TabsTrigger value="past">Past Events</TabsTrigger>
                  <TabsTrigger value="registered">Registered</TabsTrigger>
                </div>
                {isStudentLeader() && (
                  <Button className="ml-auto" variant="default" onClick={() => setIsAddEventOpen(true)}>
                    <Plus className="h-4 w-3 mr-2" />
                    Add Event
                  </Button>
                )}
              </TabsList>

              <TabsContent value="upcoming" className="space-y-6">
                {events.map(event => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {new Date(event.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-600">{event.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.attendees}/{event.maxCapacity} attending
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                          <div className="text-sm text-gray-600">Organized by: {event.organizer}</div>
                          {user && (
                            <Button
                              className="ml-auto"
                              disabled={event.current_attendees >= event.max_attendees}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsRegisterDialogOpen(true);
                              }}
                            >
                              {event.current_attendees >= event.max_attendees ? "Event Full" : "Register Now"}
                            </Button>
                          )}
                          <Button className="ml-auto" onClick={() => setIsRegisterDialogOpen(true)}>
                            Register Now
                          </Button>
                          <RegisterDialog
                            isOpen={isRegisterDialogOpen}
                            onClose={() => setIsRegisterDialogOpen(false)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="past">
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">Past events will be shown here</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="registered">
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">Your registered events will appear here</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {isStudentLeader() && (
        <AddEventForm isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSubmit={handleSubmit} />
      )}

      <RegisterDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onConfirm={() => handleRegister(selectedEvent?.id)}
        event={selectedEvent}
      />
      <Footer />
    </div>
  );
};

export default EventsPage;

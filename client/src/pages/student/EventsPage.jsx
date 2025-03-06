import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import AddEventForm from "../../components/leader/AddEventForm";
import { Plus } from "lucide-react";
import RegisterDialog from "../../components/common/RegisterDialog";
import EventDetailsDialog from "../../components/common/EventDialog";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const EventsPage = () => {
  const { isStudentLeader } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedEventType, setSelectedEventType] = useState("all");

  // Fetch all events once
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch events");
      }

      const data = await response.json();
      // console.log("Parsed Data:", data);
      setAllEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered events once
  const fetchRegisteredEvents = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`http://localhost:8080/api/events/registered/${session.data.session.user.id}`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      const data = await response.json();
      setRegisteredEvents(data || []);
    } catch (error) {
      console.error("Error fetching registered events:", error);
    }
  };

  // Fetch all data once on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchAllEvents(), fetchRegisteredEvents()]);
    };
    fetchInitialData();
  }, []);

  const getFilteredEvents = () => {
    let filteredEvents = [];

    if (activeTab === "registered") {
      filteredEvents = registeredEvents.filter(event =>
        selectedEventType === "all" ? true : event.event_type === selectedEventType
      );
    } else {
      const now = new Date();
      filteredEvents = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        const matchesEventType = selectedEventType === "all" || event.event_type === selectedEventType;

        switch (activeTab) {
          case "upcoming":
            return eventDate > now && event.status === "upcoming" && matchesEventType;
          case "past":
            return eventDate < now && event.status === "past" && matchesEventType;
          case "cancelled":
            return event.status === "cancelled" && matchesEventType;
          default:
            return matchesEventType;
        }
      });
    }

    // Sort events by date - most recent at the top
    return filteredEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
  };

  // Handle event registration
  const handleRegister = async eventId => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`http://localhost:8080/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register for event");
      }

      toast({
        title: "Success!",
        description: "You have successfully registered for the event.",
      });

      // Refresh both event lists after registration
      await Promise.all([fetchAllEvents(), fetchRegisteredEvents()]);
      setIsRegisterDialogOpen(false);
    } catch (error) {
      console.error("Error registering for event:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          venue: eventData.venue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      // Refresh events after creating a new one
      await fetchAllEvents();
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

  const formatEventDate = dateString => {
    if (!dateString || dateString === "0001-01-01T00:00:00Z") {
      return "Date not set";
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventTime = dateString => {
    if (!dateString || dateString === "0001-01-01T00:00:00Z") {
      return "Time not set";
    }
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Combined function for date and time display
  // const formatEventDateTime = dateString => {
  //   if (!dateString || dateString === "0001-01-01T00:00:00Z") {
  //     return "Date and time not set";
  //   }
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-US", {
  //     weekday: "long",
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  const handleEventTypeClick = type => {
    setSelectedEventType(type);
  };

  const getEventTypeColor = type => {
    const colors = {
      Social: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      Career: "bg-green-100 text-green-800 hover:bg-green-200",
      Academic: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      Cultural: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };
    return colors[type] || "bg-gray-200 text-gray-800 hover:bg-gray-300";
  };

  const getStatusColor = status => {
    const colors = {
      upcoming: "bg-green-100 text-green-800 hover:bg-green-200",
      past: "bg-gray-100 text-gray-800 hover:bg-gray-300",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderEventCard = (event, setSelectedEvent, setIsEventDetailsOpen) => {
    const isRegisteredTab = activeTab === "registered";
    const showRegisterButton = event.status === "upcoming" && !isRegisteredTab;

    return (
      <Card
        key={event.id}
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedEvent(event);
          setIsEventDetailsOpen(true);
        }}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatEventDate(event.event_date)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
              {isRegisteredTab && <Badge className="bg-gray-100 text-green-800 hover:bg-green-200">Registered</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">{event.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatEventTime(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>
                  {event.current_attendees}/{event.max_attendees} attending
                </span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4">
              {showRegisterButton && (
                <Button
                  disabled={event.current_attendees >= event.max_attendees}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setIsRegisterDialogOpen(true);
                  }}
                >
                  {event.current_attendees >= event.max_attendees ? "Event Full" : "Register Now"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
                <div className="space-y-2 space-x-2">
                  <Badge
                    className={`cursor-pointer ${
                      selectedEventType === "all" ? "bg-gray-800 text-white" : "bg-gray-700"
                    }`}
                    onClick={() => handleEventTypeClick("all")}
                  >
                    All
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${
                      selectedEventType === "Social" ? getEventTypeColor("Social") : "bg-gray-700"
                    }`}
                    onClick={() => handleEventTypeClick("Social")}
                  >
                    Social
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${
                      selectedEventType === "Career" ? getEventTypeColor("Career") : "bg-gray-700"
                    }`}
                    onClick={() => handleEventTypeClick("Career")}
                  >
                    Career
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${
                      selectedEventType === "Academic" ? getEventTypeColor("Academic") : "bg-gray-700"
                    }`}
                    onClick={() => handleEventTypeClick("Academic")}
                  >
                    Academic
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${
                      selectedEventType === "Cultural" ? getEventTypeColor("Cultural") : "bg-gray-700"
                    }`}
                    onClick={() => handleEventTypeClick("Cultural")}
                  >
                    Cultural
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                  <TabsTrigger value="past">Past Events</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled Events</TabsTrigger>
                  <TabsTrigger value="registered">My Registrations</TabsTrigger>
                </div>
                {isStudentLeader() && (
                  <Button className="ml-auto" variant="default" onClick={() => setIsAddEventOpen(true)}>
                    <Plus className="h-4 w-3 mr-2" />
                    Add Event
                  </Button>
                )}
              </TabsList>

              <TabsContent value={activeTab} className="space-y-6">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : error ? (
                  <div className="text-center text-red-500 py-4">{error}</div>
                ) : getFilteredEvents().length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No events found</div>
                ) : (
                  getFilteredEvents().map(event => renderEventCard(event, setSelectedEvent, setIsEventDetailsOpen))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {isStudentLeader() && (
        <AddEventForm isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSubmit={handleSubmit} />
      )}

      <EventDetailsDialog
        isOpen={isEventDetailsOpen}
        setIsOpen={setIsEventDetailsOpen}
        event={selectedEvent}
        setIsRegisterDialogOpen={setIsRegisterDialogOpen}
      />

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

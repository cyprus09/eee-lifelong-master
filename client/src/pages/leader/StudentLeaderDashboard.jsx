import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Users, Download, BarChart2, Home, Star } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import AddEventForm from "../../components/leader/AddEventForm";
import EditEventForm from "../../components/leader/EditEventForm";
import RoomManagementDialog from "../leader/RoomManagementDialog";
import ExportEventsDialog from "../../components/common/ExportEventsDialog";
import ExportAttendeesDialog from "../../components/common/ExportAttendeesDialog";
import DashboardOverview from "./DashboardOverview";
import RoomCalendarView from "./RoomCalendarView";
import EventManagement from "./EventManagement";
import EventAnalytics from "./EventAnalytics";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import CancelDialog from "../../components/common/CancelDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const StudentLeaderDashboard = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const { user, isStudentLeader, isAdmin } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isAttendeeDialogOpen, setIsAttendeeDialogOpen] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [eventFormData, setEventFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [attendees, setAttendees] = useState([]);
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    cancelledEvents: 0,
    totalRegistrations: 0,
    mostPopularEvent: null,
    mostPopularType: null,
  });
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isExportEventsDialogOpen, setIsExportEventsDialogOpen] = useState(false);
  const [isExportAttendeesDialogOpen, setIsExportAttendeesDialogOpen] = useState(false);

  // Centralized function to reset all dialog states
  const resetDialogStates = () => {
    setIsAttendeeDialogOpen(false);
    setIsCancelDialogOpen(false);
    setIsEditEventOpen(false);
    setIsAddEventOpen(false);
    setIsRoomDialogOpen(false);
    setIsExportEventsDialogOpen(false);
    setIsExportAttendeesDialogOpen(false);
    setSelectedEvent(null);
    setAttendees([]);
    setSelectedRoom(null);
    setEventFormData(null);
  };

  // Fetch all events
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const url = `${apiUrl}/api/events`;
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
      setAllEvents(data || []);

      const stats = calculateEventStats(data);
      setEventStats(stats);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate event statistics
  const calculateEventStats = events => {
    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        cancelledEvents: 0,
        totalRegistrations: 0,
        mostPopularEvent: null,
        mostPopularType: null,
      };
    }

    const now = new Date();

    const upcoming = events.filter(e => new Date(e.event_date) > now && e.status === "upcoming").length;
    const past = events.filter(e => new Date(e.event_date) < now && e.status === "past").length;
    const cancelled = events.filter(e => e.status === "cancelled").length;

    const totalRegs = events.reduce((sum, event) => sum + (event.current_attendees || 0), 0);

    const mostPopular = [...events].sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))[0];

    const eventTypeCount = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const mostPopularType = Object.entries(eventTypeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)[0];

    return {
      totalEvents: events.length,
      upcomingEvents: upcoming,
      pastEvents: past,
      cancelledEvents: cancelled,
      totalRegistrations: totalRegs,
      mostPopularEvent: mostPopular,
      mostPopularType: mostPopularType,
    };
  };

  const fetchEventAttendees = async eventId => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/api/events/${eventId}/attendees`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attendees");
      }

      const data = await response.json();
      setAttendees(data || []);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendee information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/api/events/registered/${session.data.session.user.id}`, {
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

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchAllEvents(), fetchRegisteredEvents()]);
    };
    fetchInitialData();

    if (!isStudentLeader() && !isAdmin()) {
      window.location.href = "/events";
    }

    // Cleanup function to ensure all dialog states are reset when component unmounts
    return () => {
      resetDialogStates();
    };
  }, []);

  const handleRoomSelection = room => {
    setSelectedRoom(room);
    setIsRoomDialogOpen(false);

    if (isAddEventOpen) {
      setEventFormData(prev => ({
        ...prev,
        venue: room.name,
        event_date: room.selectedTimeSlot
          ? new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
              parseInt(room.selectedTimeSlot.startTime.split(":")[0]),
              parseInt(room.selectedTimeSlot.startTime.split(":")[1])
            ).toISOString()
          : prev.event_date,
        end_time: room.selectedTimeSlot ? room.selectedTimeSlot.endTime : prev.end_time,
      }));
    } else {
      setIsAddEventOpen(true);
    }

    const timeInfo = room.selectedTimeSlot
      ? ` (${room.selectedTimeSlot.startTime} - ${room.selectedTimeSlot.endTime})`
      : "";

    toast({
      title: "Room Selected",
      description: `Selected ${room.name} (Capacity: ${room.capacity})${timeInfo}`,
    });
  };

  const handleCancelEvent = async eventId => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${apiUrl}/api/events/${eventId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel event");
      }

      toast({
        title: "Success",
        description: "Event has been cancelled successfully",
      });

      await fetchAllEvents();

      // Clear dialog states
      setIsCancelDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast({
        title: "Error",
        description: "Failed to cancel event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle event creation
  const handleSubmit = async eventData => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${apiUrl}/api/events`, {
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

  const handleEditEvent = async (eventId, eventData) => {
    try {
      setLoading(true);
      // Ensure we have a proper ID string
      const id = typeof eventId === "string" ? eventId : eventId.id;

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      console.log("Submitting event data:", eventData); // Debug: Log the data being sent

      const response = await fetch(`${apiUrl}/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update event: ${response.status}`);
      }

      // Refresh events after updating
      await fetchAllEvents();

      // Clear dialog states
      setIsEditEventOpen(false);
      setSelectedEvent(null);

      toast({
        title: "Success!",
        description: "Event updated successfully.",
      });
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Event update failed",
        description: `There was a problem updating the event: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // const formatEventTime = dateString => {
  //   if (!dateString || dateString === "0001-01-01T00:00:00Z") {
  //     return "Time not set";
  //   }
  //   return new Date(dateString).toLocaleTimeString("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  const getEventTypeColor = type => {
    const colors = {
      Social: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      Career: "bg-green-100 text-green-800 hover:bg-green-200",
      Academic: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      Cultural: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };
    return colors[type] || "bg-gray-200 text-gray-800 hover:bg-gray-300";
  };

  const handleViewAttendees = event => {
    setSelectedEvent(event);
    fetchEventAttendees(event.id);
    setIsAttendeeDialogOpen(true);
  };

  // Render rooms management
  const renderRoomsCalendar = () => {
    return (
      <div className="space-y-4">
        <RoomCalendarView />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col p-4 border-r min-h-[calc(100vh-64px)]">
          <div className="space-y-2 mt-6">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("events")}
            >
              <CalendarIcon className="h-4 w-4" />
              Events
            </Button>
            <Button
              variant={activeTab === "rooms" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("rooms")}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Room Calendar
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>

          <div className="mt-auto">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Student Leader</h4>
                    <p className="text-sm text-gray-600">{user?.email || "User"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 py-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Mobile view tabs */}
            <div className="md:hidden mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="rooms">Rooms</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Page header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {activeTab === "dashboard" && "Dashboard Overview"}
                  {activeTab === "events" && "Event Management"}
                  {activeTab === "rooms" && "Room Calendar"}
                  {activeTab === "analytics" && "Event Analytics"}
                </h1>
                <p className="text-gray-600">
                  {activeTab === "dashboard" && "Welcome back, view your event stats and insights"}
                  {activeTab === "events" && "Create, edit, and manage your events"}
                  {activeTab === "rooms" && "Check room availability and book spaces"}
                  {activeTab === "analytics" && "Track event performance and trends"}
                </p>
              </div>
            </div>

            {/* Page content based on active tab */}
            <div className="pb-8">
              {activeTab === "dashboard" && (
                <DashboardOverview
                  eventStats={eventStats}
                  allEvents={allEvents}
                  getEventTypeColor={getEventTypeColor}
                  formatEventDate={formatEventDate}
                  handleViewAttendees={handleViewAttendees}
                />
              )}

              {activeTab === "events" && (
                <EventManagement
                  allEvents={allEvents}
                  loading={loading}
                  error={error}
                  isStudentLeader={isStudentLeader()}
                  fetchAllEvents={fetchAllEvents}
                  setIsAddEventOpen={setIsAddEventOpen}
                  setSelectedEvent={setSelectedEvent}
                  setIsEditEventOpen={setIsEditEventOpen}
                  setIsCancelDialogOpen={setIsCancelDialogOpen}
                  setIsExportEventsDialogOpen={setIsExportEventsDialogOpen}
                  handleViewAttendees={handleViewAttendees}
                />
              )}
              {activeTab === "rooms" && renderRoomsCalendar()}
              {activeTab === "analytics" && <EventAnalytics allEvents={allEvents} eventStats={eventStats} />}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Form Dialog */}
      <AddEventForm
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setEventFormData(null);
          setSelectedRoom(null);
        }}
        onSubmit={handleSubmit} 
        onSuccess={fetchAllEvents}
      />

      {/* Edit Event Form Dialog */}
      {selectedEvent && (
        <EditEventForm
          isOpen={isEditEventOpen}
          onClose={() => {
            setIsEditEventOpen(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleEditEvent}
          onSuccess={fetchAllEvents}
          event={selectedEvent}
        />
      )}

      {/* Cancel Event Dialog */}
      <CancelDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSelectedEvent(null);
        }}
        onConfirm={() => handleCancelEvent(selectedEvent?.id)}
        event={selectedEvent}
      />

      {/* Room selection dialog */}
      <RoomManagementDialog
        isOpen={isRoomDialogOpen}
        onClose={() => {
          setIsRoomDialogOpen(false);
          if (!isAddEventOpen) {
            setSelectedRoom(null);
          }
        }}
        onRoomSelect={handleRoomSelection}
        selectedDate={selectedDate}
      />

      {/* Attendee list dialog */}
      <Dialog
        open={isAttendeeDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setIsAttendeeDialogOpen(false);
            setAttendees([]);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Event Attendees</DialogTitle>
            <DialogDescription>
              {selectedEvent && `Viewing all registrations for "${selectedEvent.title}"`}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">Loading attendee data...</div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No registered attendees found for this event.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map(attendee => (
                  <TableRow key={attendee.id}>
                    <TableCell className="font-medium">{attendee.name}</TableCell>
                    <TableCell>{attendee.email}</TableCell>
                    <TableCell>{new Date(attendee.registration_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAttendeeDialogOpen(false);
                setAttendees([]);
                setSelectedEvent(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsExportAttendeesDialogOpen(true);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Attendees Dialog */}
      <ExportAttendeesDialog
        isOpen={isExportAttendeesDialogOpen}
        onClose={() => {
          setIsExportAttendeesDialogOpen(false);
        }}
        attendees={attendees}
        eventTitle={selectedEvent?.title}
      />

      {/* Export Events Dialog */}
      {isExportEventsDialogOpen && (
        <ExportEventsDialog
          isOpen={isExportEventsDialogOpen}
          onClose={() => {
            setIsExportEventsDialogOpen(false);
          }}
          events={allEvents}
        />
      )}

      <Footer />
    </div>
  );
};

export default StudentLeaderDashboard;

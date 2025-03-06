import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Plus,
  ChevronRight,
  AlertTriangle,
  BarChart2,
  Home,
  Download,
  Trash2,
  Edit,
  Star,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import AddEventForm from "../../components/leader/AddEventForm";
import EditEventForm from "../../components/leader/EditEventForm";
import RoomManagementDialog from "../leader/RoomManagementDialog";
import ExportEventsDialog from "../../components/common/ExportEventsDialog";
import ExportAttendeesDialog from "../../components/common/ExportAttendeesDialog";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import CancelDialog from "../../components/common/CancelDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudentLeaderDashboard = () => {
  const { user, isStudentLeader } = useAuth();
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
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedEventStatus, setSelectedEventStatus] = useState("all");
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

  // Fetch all events
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
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`http://localhost:8080/api/events/${eventId}/attendees`, {
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
    }
  };

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

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchAllEvents(), fetchRegisteredEvents()]);
    };
    fetchInitialData();

    if (!isStudentLeader()) {
      window.location.href = "/events";
    }
  }, []);

  const getFilteredEvents = () => {
    const now = new Date();
    return allEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      const matchesEventType = selectedEventType === "all" || event.event_type === selectedEventType;

      let matchesStatus;

      if (selectedEventStatus === "all") {
        matchesStatus = true;
      } else if (selectedEventStatus === "upcoming") {
        matchesStatus = eventDate > now && event.status === "upcoming";
      } else if (selectedEventStatus === "past") {
        matchesStatus = eventDate < now && event.status === "past";
      } else if (selectedEventStatus === "cancelled") {
        matchesStatus = event.status === "cancelled";
      }

      return matchesEventType && matchesStatus;
    });
  };

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
        // You could also save the end time if your event model supports it
        // end_time: room.selectedTimeSlot ? room.selectedTimeSlot.endTime : prev.end_time,
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

  const handleCloseDialog = () => {
    setIsAttendeeDialogOpen(false);
    setAttendees([]);
    setSelectedEvent(null);

    setTimeout(() => {}, 0);
  };

  const handleCancelEvent = async eventId => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`http://localhost:8080/api/events/${eventId}/cancel`, {
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
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast({
        title: "Error",
        description: "Failed to cancel event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = async (eventId, eventData) => {
    try {
      const id = typeof eventId === "string" ? eventId : eventId.id;

      const session = await supabase.auth.getSession();
      const response = await fetch(`http://localhost:8080/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      // Refresh events after updating
      await fetchAllEvents();
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
        description: "There was a problem updating the event. Please try again.",
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

  const getStatusColor = status => {
    const colors = {
      upcoming: "bg-green-100 text-green-800 hover:bg-green-200",
      past: "bg-gray-100 text-gray-800 hover:bg-gray-300",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleViewAttendees = event => {
    setSelectedEvent(event);
    fetchEventAttendees(event.id);
    setIsAttendeeDialogOpen(true);
  };

  const renderDashboardOverview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{eventStats.totalEvents}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{eventStats.upcomingEvents}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{eventStats.totalRegistrations}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Cancelled Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{eventStats.cancelledEvents}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Dashboard insights section
  const renderDashboardInsights = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {allEvents.filter(e => e.status === "upcoming").length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Registrations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEvents
                    .filter(e => e.status === "upcoming")
                    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                    .slice(0, 5)
                    .map(event => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                        </TableCell>
                        <TableCell>{formatEventDate(event.event_date)}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{event.current_attendees}</span>/{event.max_attendees}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No upcoming events scheduled</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Popular Event</CardTitle>
          </CardHeader>
          <CardContent>
            {eventStats.mostPopularEvent ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">{eventStats.mostPopularEvent.title}</div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventTypeColor(eventStats.mostPopularEvent.event_type)}>
                    {eventStats.mostPopularEvent.event_type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatEventDate(eventStats.mostPopularEvent.event_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">{eventStats.mostPopularEvent.current_attendees}</span>
                  <span className="text-sm text-gray-500">registrations</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleViewAttendees(eventStats.mostPopularEvent)}
                >
                  View Attendees
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No event data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Event management section
  const renderEventManagement = () => {
    const filteredEvents = getFilteredEvents();

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Career">Career</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEventStatus} onValueChange={setSelectedEventStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsExportEventsDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <div className="mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="max-w-sm mx-auto mb-4">
                There are no events matching your current filters. Try adjusting your filters or create a new event.
              </p>
              <Button onClick={() => setIsAddEventOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                    </TableCell>
                    <TableCell>{formatEventDate(event.event_date)}</TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{event.current_attendees}</span>/{event.max_attendees}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewAttendees(event)}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>View Attendees</span>
                          </DropdownMenuItem>
                          {event.status === "upcoming" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsEditEventOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Event</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel Event</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  // Render rooms management
  const renderRoomsManagement = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Room Availability</h2>
          <Button onClick={() => setIsRoomDialogOpen(true)}>
            <MapPin className="h-4 w-4 mr-2" />
            Select Room
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selected Date: {selectedDate.toLocaleDateString()}</CardTitle>
            <CardDescription>Room availability for the selected date is shown below</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border mx-auto mb-4"
            />
            <Button className="w-full mt-4" onClick={() => setIsRoomDialogOpen(true)}>
              Check Availability
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Analytics section
  const renderAnalytics = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Event Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Events by Type</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Event type distribution chart would appear here</p>
                  <p className="text-sm">Most popular: {eventStats.mostPopularType || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Registration trends chart would appear here</p>
                  <p className="text-sm">Total: {eventStats.totalRegistrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Performance Overview</CardTitle>
            <CardDescription>Registration rates compared to maximum capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Fill Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents
                  .filter(e => e.max_attendees > 0)
                  .sort((a, b) => b.current_attendees / b.max_attendees - a.current_attendees / a.max_attendees)
                  .slice(0, 5)
                  .map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                      </TableCell>
                      <TableCell>{formatEventDate(event.event_date)}</TableCell>
                      <TableCell>
                        {event.current_attendees}/{event.max_attendees}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              event.current_attendees / event.max_attendees > 0.8
                                ? "bg-green-600"
                                : event.current_attendees / event.max_attendees > 0.5
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${(event.current_attendees / event.max_attendees) * 100}%` }}
                          ></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
              Room Management
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
                  {activeTab === "rooms" && "Room Management"}
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
                <>
                  {renderDashboardOverview()}
                  {renderDashboardInsights()}
                </>
              )}

              {activeTab === "events" && renderEventManagement()}

              {activeTab === "rooms" && renderRoomsManagement()}

              {activeTab === "analytics" && renderAnalytics()}
            </div>
          </div>
        </div>
      </div>

      <AddEventForm isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSubmit={handleSubmit} />
      {selectedEvent && (
        <EditEventForm
          isOpen={isEditEventOpen}
          onClose={() => {
            setIsEditEventOpen(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleEditEvent}
          event={selectedEvent}
        />
      )}

      <CancelDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => handleCancelEvent(selectedEvent?.id)}
        event={selectedEvent}
      />

      {/* Room selection dialog */}
      <RoomManagementDialog
        isOpen={isRoomDialogOpen}
        onClose={() => setIsRoomDialogOpen(false)}
        onRoomSelect={handleRoomSelection}
        selectedDate={selectedDate}
      />

      {/* Attendee list dialog */}
      <Dialog open={isAttendeeDialogOpen} onOpenChange={setIsAttendeeDialogOpen}>
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
            <Button variant="outline" onClick={() => handleCloseDialog()}>
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

      <ExportAttendeesDialog
        isOpen={isExportAttendeesDialogOpen}
        onClose={() => setIsExportAttendeesDialogOpen(false)}
        attendees={attendees}
        eventTitle={selectedEvent?.title}
      />

      {isExportEventsDialogOpen && (
        <ExportEventsDialog
          isOpen={isExportEventsDialogOpen}
          onClose={() => setIsExportEventsDialogOpen(false)}
          events={allEvents}
        />
      )}

      <Footer />
    </div>
  );
};

export default StudentLeaderDashboard;

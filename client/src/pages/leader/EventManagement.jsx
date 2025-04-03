import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Download,
  Trash2,
  Edit,
  Plus,
  ChevronRight,
  Users,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../../lib/supabaseClient";

const EventManagement = ({ 
  allEvents, 
  loading, 
  error, 
  isStudentLeader,
  fetchAllEvents,
  setIsAddEventOpen,
  setSelectedEvent, 
  setIsEditEventOpen,
  setIsCancelDialogOpen,
  setIsExportEventsDialogOpen,
  handleViewAttendees
}) => {
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedEventStatus, setSelectedEventStatus] = useState("all");
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

  const handleCancelEvent = async (eventId) => {
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
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast({
        title: "Error",
        description: "Failed to cancel event. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          {isStudentLeader && (
            <Button onClick={() => setIsAddEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
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
                <TableHead>Time</TableHead>
                <TableHead>End</TableHead>
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
                  <TableCell>{formatEventTime(event.event_date)}</TableCell>
                  <TableCell>{formatEventTime(event.event_end)}</TableCell>
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

export default EventManagement;
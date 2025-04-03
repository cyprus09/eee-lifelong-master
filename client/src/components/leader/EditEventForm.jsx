import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const EditEventForm = ({ isOpen, onClose, onSubmit, onSuccess, event }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    event_type: "",
    event_date: new Date(),
    event_time: "12:00",
    event_end_time: "14:00", // This is just for the form UI
    venue: "",
    max_attendees: "",
    description: "",
    status: "upcoming",
  });

  // Clean up and reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.classList.remove("overflow-hidden");
      }, 100);
    }
  }, [isOpen]);

  // Fetch rooms when the component mounts or dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  // Populate form with event data when the component mounts or event changes
  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.event_date);
      const hours = eventDate.getHours().toString().padStart(2, "0");
      const minutes = eventDate.getMinutes().toString().padStart(2, "0");

      // Handle event_end
      const eventEnd = new Date(event.event_end);
      const hoursEnd = eventEnd.getHours().toString().padStart(2, "0");
      const minutesEnd = eventEnd.getMinutes().toString().padStart(2, "0");

      setFormData({
        title: event.title || "",
        event_type: event.event_type || "",
        event_date: eventDate,
        event_time: `${hours}:${minutes}`,
        event_end_time: `${hoursEnd}:${minutesEnd}`, // This is just for the form UI
        venue: event.venue || "",
        max_attendees: event.max_attendees?.toString() || "",
        description: event.description || "",
        status: event.status || "upcoming",
      });
    }
  }, [event]);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      console.log(`Fetching rooms from: ${apiUrl}/api/rooms`);

      const response = await fetch(`${apiUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to fetch rooms: ${response.status}` }));
        throw new Error(errorData.error || `Failed to fetch rooms: ${response.status}`);
      }

      const data = await response.json();
      console.log("Successfully fetched rooms:", data.length);
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error",
        description: `Failed to load rooms: ${error.message}`,
        variant: "destructive",
      });
      // Fallback to hardcoded rooms if API fails
      setRooms([
        { id: "eee-auditorium", name: "EEE Auditorium" },
        { id: "eee-lab-3", name: "EEE Lab 3" },
        { id: "lecture-theatre-1", name: "Lecture Theatre 1" },
        { id: "research-techno-plaza", name: "Research Techno Plaza" },
        { id: "university-cultural-centre", name: "University Cultural Centre" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add the same time updating functionality as in AddEventForm
  const updateEndTime = startTime => {
    const [hours, minutes] = startTime.split(":");
    let endHours = parseInt(hours) + 2;
    if (endHours >= 24) {
      endHours = endHours - 24;
    }
    const formattedEndHours = endHours.toString().padStart(2, "0");
    return `${formattedEndHours}:${minutes}`;
  };

  const handleTimeChange = value => {
    setFormData(prev => ({
      ...prev,
      event_time: value,
      event_end_time: updateEndTime(value),
    }));
  };

  const handleDialogClose = () => {
    // First close the dialog
    onClose();

    // Then perform cleanup with a small delay to ensure dialog is fully closed
    setTimeout(() => {
      document.body.style.pointerEvents = "";
      document.body.classList.remove("overflow-hidden");
    }, 100);
  };

  // Find the room ID based on the venue name (for populating the select)
  const findRoomIdByName = useCallback(
    venueName => {
      if (!venueName || !rooms.length) return "";
      const room = rooms.find(r => r.name === venueName);
      return room ? room.id : "";
    },
    [rooms]
  );

  // Add the missing handleSubmit function
  const handleSubmit = e => {
    e.preventDefault();

    // Create a new date object for the event date and set the time
    const eventDate = new Date(formData.event_date);
    const [startHours, startMinutes] = formData.event_time.split(":");
    eventDate.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0, 0);

    // Create a new date object for the event end time
    const eventEndDate = new Date(formData.event_date);
    const [endHours, endMinutes] = formData.event_end_time.split(":");
    eventEndDate.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

    // Handle venue selection - use the name from rooms if it's an ID
    let venueValue = formData.venue;
    if (rooms.length > 0) {
      const selectedRoom = rooms.find(room => room.id === formData.venue);
      if (selectedRoom) {
        venueValue = selectedRoom.name;
      }
    }

    // Prepare the event data to submit
    const eventData = {
      title: formData.title,
      event_type: formData.event_type,
      event_date: eventDate.toISOString(),
      event_end: eventEndDate.toISOString(), // Make sure to include event_end
      venue: venueValue,
      max_attendees: parseInt(formData.max_attendees, 10),
      description: formData.description,
      status: formData.status,
    };

    // Call the onSubmit function passed as prop with the event id and event data
    onSubmit(event.id, eventData);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleDialogClose();
      }}
    >
      <DialogContent className="max-w-2xl mx-4 h-[90vh] overflow-y-auto p-6 bg-gray-50">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select onValueChange={value => handleChange("event_type", value)} value={formData.event_type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={formData.event_date}
                    onSelect={date => handleChange("event_date", date)}
                    className="rounded-md border"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_time">Start Time</Label>
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={e => handleTimeChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_end_time">End Time</Label>
                    <Input
                      id="event_end_time"
                      type="time"
                      value={formData.event_end_time}
                      onChange={e => handleChange("event_end_time", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Venue</Label>
                <div className="relative">
                  <Select
                    onValueChange={value => handleChange("venue", value)}
                    value={findRoomIdByName(formData.venue) || formData.venue}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading rooms..." : "Select venue"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="Loading" disabled>
                          Loading rooms...
                        </SelectItem>
                      ) : rooms.length > 0 ? (
                        rooms.map(room => (
                          <SelectItem key={room.id || room.name} value={room.id || room.name}>
                            {room.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="NoRooms" disabled>
                          No rooms available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {loading && (
                    <div className="absolute right-10 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {rooms.length === 0 && !loading && (
                  <div className="flex items-center mt-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Using fallback room list. API connection issue detected.</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attendees">Maximum Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  min="1"
                  value={formData.max_attendees}
                  onChange={e => handleChange("max_attendees", e.target.value)}
                  placeholder="Maximum number of attendees"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Enter event description"
                  className="h-32"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button type="submit">Update Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventForm;

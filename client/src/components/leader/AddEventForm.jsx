import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "../../hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle } from "lucide-react";

const AddEventForm = ({ isOpen, onClose, onSubmit }) => {
  const { isStudentLeader } = useAuth();

  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "",
    event_date: new Date(),
    event_time: "12:00",
    event_end_time: "14:00",
    venue: "",
    max_attendees: "",
    description: "",
    status: "upcoming",
  });

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        console.warn("No active session found");
        throw new Error("No active session");
      }

      // Log the API URL for debugging
      console.log(`Fetching rooms from: ${apiUrl}/api/rooms`);

      const response = await fetch(`${apiUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Room API response status:", response.status);

      // If not OK, try to get the error data
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch rooms: ${response.status}`);
        } catch (error) {
          const text = await response.text();
          console.error("Non-JSON error response:", text.substring(0, 200));
          throw new Error(`Failed to fetch rooms: ${response.status}`);
        }
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

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // Process start date/time
      const startDateObj = new Date(formData.event_date);
      const [startHours, startMinutes] = formData.event_time.split(":");
      startDateObj.setHours(parseInt(startHours), parseInt(startMinutes), 0);

      // Process end date/time (same date as start, different time)
      const endDateObj = new Date(formData.event_date);
      const [endHours, endMinutes] = formData.event_end_time.split(":");
      endDateObj.setHours(parseInt(endHours), parseInt(endMinutes), 0);

      // If end time is earlier than start time, assume it's the next day
      if (endDateObj < startDateObj) {
        endDateObj.setDate(endDateObj.getDate() + 1);
      }

      // Find the selected room object to pass the correct venue name
      const selectedRoom = rooms.find(room => room.id === formData.venue);

      const formattedData = {
        ...formData,
        event_date: startDateObj.toISOString(),
        event_end: endDateObj.toISOString(),
        max_attendees: parseInt(formData.max_attendees),
        current_attendees: 0,
        venue: selectedRoom?.name || formData.venue, // Use the room name instead of ID
      };

      // Remove temporary form fields
      delete formattedData.event_time;
      delete formattedData.event_end_time;

      console.log("Submitting event data:", formattedData);
      console.log("Current user is student leader:", isStudentLeader());

      // Check if user is student leader before submitting
      if (!isStudentLeader()) {
        toast({
          title: "Permission Error",
          description: "Only student leaders can create events.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(formattedData);
      onClose();

      // Reset form data
      setFormData({
        title: "",
        event_type: "",
        event_date: new Date(),
        event_time: "12:00",
        event_end_time: "14:00",
        venue: "",
        max_attendees: "",
        description: "",
        status: "upcoming",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to create event: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-4 h-[90vh] overflow-y-auto p-6 bg-gray-50">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
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
                <Select onValueChange={value => handleChange("event_type", value)} required>
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
                  <Select onValueChange={value => handleChange("venue", value)} required value={formData.venue}>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading rooms..." : "Select venue"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          Loading rooms...
                        </SelectItem>
                      ) : rooms.length > 0 ? (
                        rooms.map(room => (
                          <SelectItem key={room.id} value={room.id || room.name}>
                            {room.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
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
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isStudentLeader()}>
              {isStudentLeader() ? "Create Event" : "Only Student Leaders Can Create Events"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventForm;

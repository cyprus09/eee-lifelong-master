import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AddEventForm = ({ isOpen, onClose, onSubmit }) => {
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

      const formattedData = {
        ...formData,
        event_date: startDateObj.toISOString(),
        event_end: endDateObj.toISOString(),
        max_attendees: parseInt(formData.max_attendees),
        current_attendees: 0,
      };

      // Remove temporary form fields
      delete formattedData.event_time;
      delete formattedData.event_end_time;

      await onSubmit(formattedData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
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
                <Select onValueChange={value => handleChange("venue", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EEE Auditorium">EEE Auditorium</SelectItem>
                    <SelectItem value="EEE Lab 3">EEE Lab 3</SelectItem>
                    <SelectItem value="Lecture Theatre 1">Lecture Theatre 1</SelectItem>
                    <SelectItem value="Research Techno Plaza">Research Techno Plaza</SelectItem>
                    <SelectItem value="University Cultural Centre">University Cultural Centre</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventForm;

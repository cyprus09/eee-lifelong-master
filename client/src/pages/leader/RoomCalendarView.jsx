import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, Users, Filter } from "lucide-react";
import AddEventForm from "../../components/leader/AddEventForm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../../lib/supabaseClient";

const RoomCalendarView = () => {
  // State for selected date and view
  const { isStudentLeader } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const [rooms, setRooms] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState(null);
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [minCapacityFilter, setMinCapacityFilter] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Room booking time selection
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Event detail state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const eventTypeColors = {
    Social: "#4285F4", // Blue
    Career: "#34A853", // Green
    Academic: "#9875FB", // Purple
    Cultural: "#FBBC05", // Yellow
    Other: "#EA4335", // Red
  };

  // Fetch all events on component mount
  useEffect(() => {
    fetchAllEvents();
    fetchRoomsData();
  }, []);

  // Fetch available rooms when room dialog opens
  useEffect(() => {
    if (isRoomDialogOpen) {
      fetchAvailableRooms();
    }
  }, [isRoomDialogOpen, selectedDate, startTime, endTime, retryCount]);

  // Generate time options for selects
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour < 22; hour++) {
      for (let minute of ["00", "30"]) {
        const time = `${hour.toString().padStart(2, "0")}:${minute}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Fetch all events from API
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
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all rooms data
  const fetchRoomsData = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const data = await response.json();
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError(error.message);
    }
  };

  // Fetch available rooms for booking
  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      // Include time parameters in the request
      const response = await fetch(
        `${apiUrl}/api/rooms/available?date=${formattedDate}&start_time=${startTime}&end_time=${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch available rooms");
      }

      const data = await response.json();
      console.log("Available rooms:", data);
      setRooms(data);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry for room fetching
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Format events for the calendar
  const formatEvents = events => {
    return events.map(event => {
      const room = rooms.find(r => r.name === event.venue) || {
        name: event.venue,
        room_type: "unknown",
        capacity: 0,
        building: "",
        floor: 0,
      };

      const start = new Date(event.event_date);
      // Use event_end if available, otherwise default to 2 hours after start
      const end = event.event_end ? new Date(event.event_end) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

      return {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        resource: room,
        status: event.status,
        description: event.description,
        attendees: event.current_attendees,
        maxAttendees: event.max_attendees,
        eventType: event.event_type,
        color: eventTypeColors[event.event_type] || eventTypeColors.Other,
      };
    });
  };

  // Generate time slots for the calendar
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate calendar days based on view
  const generateCalendarDays = () => {
    const days = [];
    const currentDate = new Date(selectedDate);

    if (calendarView === "day") {
      days.push(formatDateObject(currentDate));
    } else if (calendarView === "week") {
      // Start from Sunday of the current week
      const startOfWeek = new Date(currentDate);
      const day = currentDate.getDay();
      startOfWeek.setDate(currentDate.getDate() - day);

      // Generate 7 days (Sun-Sat)
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(formatDateObject(day));
      }
    } else if (calendarView === "month") {
      // Get first day of month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDay = new Date(firstDay);
      startDay.setDate(1 - firstDay.getDay()); // Start from the Sunday before month begins

      // Generate 6 weeks max (42 days)
      for (let i = 0; i < 42; i++) {
        const day = new Date(startDay);
        day.setDate(startDay.getDate() + i);

        days.push(formatDateObject(day));

        // Stop if we've reached next month's week
        if (day.getMonth() > currentDate.getMonth() && day.getDay() === 6) {
          break;
        }
      }
    }

    return days;
  };

  // Format date objects for display
  const formatDateObject = date => {
    return {
      date: new Date(date),
      dayName: date.toLocaleString("en-us", { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleString("en-us", { month: "short" }),
      isCurrentMonth: date.getMonth() === selectedDate.getMonth(),
      isToday: date.toDateString() === new Date().toDateString(),
    };
  };

  // Navigate calendar
  const navigateCalendar = direction => {
    const newDate = new Date(selectedDate);

    if (calendarView === "day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (calendarView === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    }

    setSelectedDate(newDate);
  };

  // Format time for display
  const formatTime = timeString => {
    const [hour, minute] = timeString.split(":");
    const hourNum = parseInt(hour);
    return `${hourNum % 12 || 12}:${minute} ${hourNum >= 12 ? "PM" : "AM"}`;
  };

  // Get room type color
  const getRoomTypeColor = type => {
    const colors = {
      classroom: "bg-blue-100 text-blue-800",
      lab: "bg-green-100 text-green-800",
      auditorium: "bg-purple-100 text-purple-800",
      meeting_room: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Check if an event is on a specific day
  const isEventOnDay = (event, day) => {
    const eventDate = new Date(event.start);
    return eventDate.toDateString() === day.date.toDateString();
  };

  // Check if an event is in a specific time slot
  const isEventInTimeSlot = (event, timeSlot, day) => {
    if (!isEventOnDay(event, day)) return false;

    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotStart = new Date(day.date);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return event.start < slotEnd && event.end > slotStart;
  };

  // Calculate event position and duration
  const getEventTimePosition = (event, day) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);

    // Ensure we're only looking at the time portion for the selected day
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();

    // Calculate position in the grid (our grid starts at 8 AM, index 0)
    const startPosition = (startHour - 8) * 2 + (startMinute >= 30 ? 1 : 0);

    // Calculate duration in 30-minute slots
    const durationMs = endTime - startTime;
    const durationMinutes = durationMs / (1000 * 60);
    const slotSpan = Math.max(1, Math.ceil(durationMinutes / 30));

    return { startPosition, slotSpan };
  };

  // Handle room selection
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

  const handleSubmit = async eventData => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch("${apiUrl}/api/events", {
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

  // Event Detail Dialog
  const EventDetailDialog = () => (
    <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedEvent?.title}</DialogTitle>
        </DialogHeader>
        {selectedEvent && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {selectedEvent.start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}{" "}
                &middot; {selectedEvent.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                {selectedEvent.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {selectedEvent.resource.name}{" "}
                {selectedEvent.resource.building ? `- ${selectedEvent.resource.building}` : ""}{" "}
                {selectedEvent.resource.floor ? `(Floor ${selectedEvent.resource.floor})` : ""}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>
                {selectedEvent.attendees}/{selectedEvent.maxAttendees} attendees
              </span>
            </div>
            <p className="text-sm text-gray-600">{selectedEvent.description}</p>

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" className="w-full" onClick={() => setEventDialogOpen(false)}>
                Close
              </Button>
              {/* <Button variant="default" className="w-full">
                View Details
              </Button> */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Room Selection Dialog
  const RoomSelectionDialog = () => (
    <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <div className="border rounded-md p-2 mt-1 text-sm">{format(selectedDate, "MMMM d, yyyy")}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Room Type</label>
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="classroom">Classroom</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="meeting_room">Meeting Room</SelectItem>
                  <SelectItem value="auditorium">Auditorium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>
                      {formatTime(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions
                    .filter(time => time > startTime)
                    .map(time => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Min. Capacity</label>
            <Select value={minCapacityFilter.toString()} onValueChange={v => setMinCapacityFilter(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Any Capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Capacity</SelectItem>
                <SelectItem value="10">10+ People</SelectItem>
                <SelectItem value="25">25+ People</SelectItem>
                <SelectItem value="50">50+ People</SelectItem>
                <SelectItem value="100">100+ People</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-2 border border-red-200 rounded-md bg-red-50">
              {error}
              <Button variant="link" size="sm" onClick={handleRetry} className="ml-2">
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <p>Loading available rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center p-4 border rounded-md">
                <p>No rooms available for the selected time slot</p>
              </div>
            ) : (
              rooms
                .filter(room => {
                  if (roomTypeFilter !== "all" && room.room_type !== roomTypeFilter) return false;
                  if (room.capacity < minCapacityFilter) return false;
                  return true;
                })
                .map(room => (
                  <Card
                    key={room.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRoomSelection(room)}
                  >
                    <CardContent className="p-4" onClick={() => setIsAddEventOpen(true)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{room.name}</h3>
                          <p className="text-sm text-gray-500">
                            {room.building} - Floor {room.floor}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${getRoomTypeColor(room.room_type)}`}
                          >
                            {room.room_type}
                          </span>
                          <p className="text-sm mt-1">{room.capacity} people</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Render calendar header with navigation
  const renderCalendarHeader = () => {
    const month = selectedDate.toLocaleString("en-us", { month: "long" });
    const year = selectedDate.getFullYear();

    let title = `${month} ${year}`;

    if (calendarView === "day") {
      title = selectedDate.toLocaleDateString("en-us", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (calendarView === "week") {
      const days = generateCalendarDays();
      if (days.length > 0) {
        const firstDay = days[0];
        const lastDay = days[days.length - 1];

        title = `${firstDay.month} ${firstDay.day} - ${lastDay.month} ${lastDay.day}, ${firstDay.year}`;
      }
    }

    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => navigateCalendar(-1)} className="mr-2">
            &lt;
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateCalendar(1)}>
            &gt;
          </Button>
          <div className="ml-4 font-medium">{title}</div>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const day = formatDateObject(selectedDate);
    const formattedEvents = formatEvents(allEvents);

    return (
      <div className="flex flex-col h-full">
        <div className="text-center py-2 border-b">
          <h3 className="font-medium">
            {day.dayName}, {day.month} {day.day}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((timeSlot, index) => {
            const matchingEvents = formattedEvents.filter(event => isEventInTimeSlot(event, timeSlot, day));

            return (
              <div key={index} className="flex border-b">
                <div className="w-16 p-2 text-xs text-gray-500 border-r">{formatTime(timeSlot)}</div>
                <div className="flex-1 min-h-8 relative">
                  {matchingEvents.map((event, eventIndex) => {
                    const { startPosition, slotSpan } = getEventTimePosition(event, day);

                    // Only render the event at its starting position
                    if (startPosition === index) {
                      return (
                        <div
                          key={eventIndex}
                          className="absolute left-0 right-0 ml-1 mr-1 rounded p-1 overflow-hidden cursor-pointer"
                          style={{
                            top: "0",
                            height: `${slotSpan * 100}%`,
                            backgroundColor: event.color,
                            opacity: event.status === "cancelled" ? 0.5 : 1,
                          }}
                          onClick={() => {
                            setSelectedEvent(event);
                            setEventDialogOpen(true);
                          }}
                        >
                          <div className="text-white text-xs font-medium truncate">{event.title}</div>
                          <div className="text-white text-xs truncate opacity-80">{event.resource.name}</div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = generateCalendarDays();
    const formattedEvents = formatEvents(allEvents);

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 text-center py-2 border-b">
          {days.map((day, index) => (
            <div key={index} className={`font-medium ${day.isToday ? "bg-blue-100 rounded" : ""}`}>
              <div>{day.dayName}</div>
              <div>
                {day.month} {day.day}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="flex border-b">
              <div className="w-16 p-2 text-xs text-gray-500 border-r">{formatTime(timeSlot)}</div>
              <div className="grid grid-cols-7 flex-1">
                {days.map((day, dayIndex) => {
                  const matchingEvents = formattedEvents.filter(event => isEventInTimeSlot(event, timeSlot, day));

                  return (
                    <div key={dayIndex} className="min-h-8 border-r relative">
                      {matchingEvents.map((event, eventIndex) => {
                        const { startPosition, slotSpan } = getEventTimePosition(event, day);

                        if (startPosition === timeIndex) {
                          return (
                            <div
                              key={eventIndex}
                              className="absolute left-0 right-0 ml-1 mr-1 rounded p-1 overflow-hidden cursor-pointer"
                              style={{
                                top: "0",
                                height: `${slotSpan * 2}rem`,
                                backgroundColor: event.color,
                                opacity: event.status === "cancelled" ? 0.5 : 1,
                                zIndex: 10,
                              }}
                              onClick={() => {
                                setSelectedEvent(event);
                                setEventDialogOpen(true);
                              }}
                            >
                              <div className="text-white text-xs font-medium truncate">{event.title}</div>
                              <div className="text-white text-xs truncate opacity-80">{event.resource.name}</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const days = generateCalendarDays();
    const formattedEvents = formatEvents(allEvents);

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 text-center py-2 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div key={index} className="font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b">
              {week.map((day, dayIndex) => {
                const dayEvents = formattedEvents.filter(event => isEventOnDay(event, day));

                return (
                  <div
                    key={dayIndex}
                    className={`border-r p-1 min-h-24 ${!day.isCurrentMonth ? "bg-gray-50" : ""} ${
                      day.isToday ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className={`text-right ${!day.isCurrentMonth ? "text-gray-400" : ""}`}>{day.day}</div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className="text-xs p-1 rounded truncate cursor-pointer"
                          style={{
                            backgroundColor: event.color,
                            opacity: event.status === "cancelled" ? 0.5 : 1,
                          }}
                          onClick={() => {
                            setSelectedEvent(event);
                            setEventDialogOpen(true);
                          }}
                        >
                          <div className="text-white font-medium">{event.title}</div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-blue-500 cursor-pointer">+ {dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const formattedEvents = formatEvents(allEvents).sort((a, b) => a.start - b.start);

    // Group events by date
    const groupedEvents = {};
    formattedEvents.forEach(event => {
      const dateKey = event.start.toDateString();
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <div className="overflow-y-auto h-full">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center p-8 text-gray-500">No events found for the selected period</div>
        ) : (
          Object.keys(groupedEvents).map((dateKey, index) => {
            const date = new Date(dateKey);
            const dateStr = date.toLocaleDateString("en-us", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });

            return (
              <div key={index} className="mb-4">
                <div className="font-medium border-b py-2">{dateStr}</div>
                <div className="space-y-2 mt-2">
                  {groupedEvents[dateKey].map((event, eventIndex) => (
                    <Card
                      key={eventIndex}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center">
                          <div
                            className="w-1 h-full self-stretch mr-3"
                            style={{
                              backgroundColor: event.color,
                              opacity: event.status === "cancelled" ? 0.5 : 1,
                            }}
                          ></div>
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500">
                              {event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                              {event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="text-sm">{event.resource.name}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render calendar content based on selected view
  const renderCalendarContent = () => {
    switch (calendarView) {
      case "day":
        return renderDayView();
      case "week":
        return renderWeekView();
      case "month":
        return renderMonthView();
      case "agenda":
        return renderAgendaView();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Room Management Calendar</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsRoomDialogOpen(true)}>
            <MapPin className="h-4 w-4 mr-2" />
            Select Room
          </Button>
          {/* <Button variant="default">
            <Filter className="h-4 w-4 mr-2" />
            Filter Options
          </Button> */}
        </div>
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>View and manage room bookings</CardDescription>
          <div className="mt-2">
            <Tabs value={calendarView} onValueChange={setCalendarView} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {renderCalendarHeader()}
        </CardHeader>
        <CardContent className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <p>Loading calendar...</p>
            </div>
          ) : (
            <div className="h-96 md:h-[600px]">{renderCalendarContent()}</div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && <EventDetailDialog />}
      <RoomSelectionDialog />
      {isStudentLeader() && (
        <AddEventForm isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSubmit={handleSubmit} />
      )}
    </div>
  );
};

export default RoomCalendarView;

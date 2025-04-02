import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Home, Calendar as CalendarIcon, Activity, PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { supabase } from "../../lib/supabaseClient";

const RoomManagementDashboard = () => {
  // State management
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Room CRUD state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    room_type: "",
    building: "",
    floor: "",
    capacity: "",
  });

  // Analytics state
  const [roomUsageData, setRoomUsageData] = useState([]);
  const [roomTypeDistribution, setRoomTypeDistribution] = useState([]);
  const [topUsedRooms, setTopUsedRooms] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 5;

  // Room types and buildings for filtering (will be extracted from fetched data)
  const [roomTypes, setRoomTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Fetch rooms and events on component mount
  useEffect(() => {
    fetchRooms();
    fetchEvents();
  }, []);

  // Apply filters whenever filter conditions change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, roomTypeFilter, buildingFilter, capacityFilter, rooms]);

  // Create analytics data when rooms and events are available
  useEffect(() => {
    if (rooms.length > 0 && events.length > 0) {
      generateAnalyticsData();

      // Extract unique room types and buildings
      const types = [...new Set(rooms.map(room => room.room_type))];
      const bldgs = [...new Set(rooms.map(room => room.building))];

      setRoomTypes(types);
      setBuildings(bldgs);
    }
  }, [rooms, events]);

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rooms");
      }

      const data = await response.json();
      setRooms(data || []);
      setFilteredRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events from API
  const fetchEvents = async () => {
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
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a new room
  const addRoom = async roomData => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`:8080/api/admin/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      // Read the response body as text
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      // Parse the text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to add room");
      }

      // Now use the parsed data instead of trying to parse the response again
      setRooms(prevRooms => [...prevRooms, data]);
      return data;
    } catch (error) {
      console.error("Error adding room:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing room
  const updateRoom = async (roomId, roomData) => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      // Update the URL to match the server-side route
      const response = await fetch(`${apiUrl}/api/admin/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to update room");
      }

      setRooms(prevRooms => prevRooms.map(room => (room.id === roomId ? data : room)));
      return data;
    } catch (error) {
      console.error("Error updating room:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a room
  const deleteRoom = async roomId => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/api/admin/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete room");
      }

      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check room availability for a specific date
  const checkRoomAvailability = (roomName, date) => {
    // Find events for this room on the specified date
    const roomEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      const checkDate = new Date(date);

      return (
        event.venue === roomName &&
        eventDate.getFullYear() === checkDate.getFullYear() &&
        eventDate.getMonth() === checkDate.getMonth() &&
        eventDate.getDate() === checkDate.getDate()
      );
    });

    return {
      available: roomEvents.length === 0,
      events: roomEvents,
    };
  };

  // Generate analytics data
  const generateAnalyticsData = () => {
    // Room usage over time (past month)
    const usageData = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateStr = date.toISOString().slice(0, 10);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.toISOString().slice(0, 10) === dateStr;
      });

      usageData.unshift({
        date: dateStr,
        events: dayEvents.length,
        attendees: dayEvents.reduce((sum, event) => sum + (event.current_attendees || 0), 0),
      });
    }
    setRoomUsageData(usageData);

    // Room type distribution
    if (roomTypes.length > 0) {
      const typeData = roomTypes.map(type => {
        const roomsOfType = rooms.filter(room => room.room_type === type);
        const eventsInType = events.filter(event => roomsOfType.some(room => room.name === event.venue));

        return {
          type,
          rooms: roomsOfType.length,
          events: eventsInType.length,
          utilization: roomsOfType.length > 0 ? Math.round((eventsInType.length / roomsOfType.length) * 100) : 0,
        };
      });
      setRoomTypeDistribution(typeData);
    }

    // Top used rooms
    const roomUsage = rooms.map(room => {
      const roomEvents = events.filter(event => event.venue === room.name);
      return {
        ...room,
        eventCount: roomEvents.length,
        attendeeCount: roomEvents.reduce((sum, event) => sum + (event.current_attendees || 0), 0),
      };
    });

    setTopUsedRooms(roomUsage.sort((a, b) => b.eventCount - a.eventCount).slice(0, 5));
  };

  // Apply filters to the rooms list
  const applyFilters = () => {
    if (!rooms.length) return;

    let filtered = [...rooms];

    if (searchTerm) {
      filtered = filtered.filter(
        room =>
          room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.building.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roomTypeFilter && roomTypeFilter !== "all") {
      filtered = filtered.filter(room => room.room_type === roomTypeFilter);
    }

    if (buildingFilter && buildingFilter !== "all") {
      filtered = filtered.filter(room => room.building === buildingFilter);
    }

    if (capacityFilter) {
      const capacity = parseInt(capacityFilter);
      filtered = filtered.filter(room => room.capacity >= capacity);
    }

    setFilteredRooms(filtered);
    setCurrentPage(1);
  };

  // Handle room form input changes
  const handleRoomFormChange = e => {
    const { name, value } = e.target;
    setRoomFormData({
      ...roomFormData,
      [name]: value,
    });
  };

  // Open modal for adding a new room
  const handleAddRoom = () => {
    setCurrentRoom(null);
    setRoomFormData({
      name: "",
      capacity: "",
      room_type: "",
      building: "",
      floor: "",
    });
    setIsRoomModalOpen(true);
  };

  // Open modal for editing an existing room
  const handleEditRoom = room => {
    setCurrentRoom(room);
    setRoomFormData({
      name: room.name,
      room_type: room.room_type,
      building: room.building,
      floor: room.floor.toString(),
      capacity: room.capacity.toString(),
    });
    setIsRoomModalOpen(true);
  };

  // Save room (create or update)
  const handleSaveRoom = async () => {
    // Validate form
    if (
      !roomFormData.name ||
      !roomFormData.room_type ||
      !roomFormData.building ||
      !roomFormData.floor ||
      !roomFormData.capacity
    ) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const processedData = {
        name: roomFormData.name,
        capacity: parseInt(roomFormData.capacity, 10),
        room_type: roomFormData.room_type,
        building: roomFormData.building,
        floor: parseInt(roomFormData.floor, 10),
      };

      if (currentRoom) {
        await updateRoom(currentRoom.id, processedData);
      } else {
        await addRoom(processedData);
      }

      setIsRoomModalOpen(false);

      // Refresh rooms list
      fetchRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      alert(`Failed to save room: ${error.message}`);
    }
  };

  // Delete a room
  const handleDeleteRoom = async roomId => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await deleteRoom(roomId);
      } catch (error) {
        console.error("Error deleting room:", error);
        alert(`Failed to delete room: ${error.message}`);
      }
    }
  };

  const calculateUtilizationRate = () => {
    if (!rooms.length) return "0%";

    const today = new Date();
    const currentMonthEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
    });

    // Count rooms that have at least one event this month
    const roomsWithEvents = new Set();
    currentMonthEvents.forEach(event => {
      if (event.venue) {
        roomsWithEvents.add(event.venue);
      }
    });

    // Calculate percentage of rooms that have been used
    const usedRoomsCount = [...roomsWithEvents].filter(venue => rooms.some(room => room.name === venue)).length;

    return Math.min(Math.round((usedRoomsCount / rooms.length) * 100), 100) + "%";
  };

  // Reset all filters
  const clearFilters = () => {
    setSearchTerm("");
    setRoomTypeFilter("all");
    setBuildingFilter("all");
    setCapacityFilter("");
  };

  // Pagination logic
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  // Summary statistics for the dashboard
  const stats = [
    {
      title: "Total Rooms",
      value: rooms.length,
      icon: Home,
      description: `${roomTypes.length || 0} different types`,
    },
    {
      title: "Total Capacity",
      value: rooms.reduce((sum, room) => sum + (room.capacity || 0), 0),
      icon: Users,
      description: "Across all rooms",
    },
    {
      title: "Events This Month",
      value: events.filter(event => {
        const eventDate = new Date(event.event_date);
        const today = new Date();
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      }).length,
      icon: CalendarIcon,
      description: "Scheduled events",
    },
    {
      title: "Utilization Rate",
      value: calculateUtilizationRate(),
      icon: Activity,
      description: "Room usage efficiency",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6 my-auto py-2 px-4 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Room Management Dashboard</h1>
          <Button onClick={handleAddRoom} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Room
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2">Loading...</p>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-600">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList>
            <TabsTrigger value="rooms">Room Management</TabsTrigger>
            <TabsTrigger value="availability">Room Availability</TabsTrigger>
            <TabsTrigger value="analytics">Room Analytics</TabsTrigger>
          </TabsList>

          {/* Room Management Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Room Directory</CardTitle>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search rooms..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col md:flex-row gap-4">
                    <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                      <SelectTrigger className="w-full md:w-1/3">
                        <SelectValue placeholder="Room Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Room Types</SelectItem>
                        {roomTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                      <SelectTrigger className="w-full md:w-1/3">
                        <SelectValue placeholder="Building" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Buildings</SelectItem>
                        {buildings.map(building => (
                          <SelectItem key={building} value={building}>
                            {building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="w-full md:w-1/3">
                      <Input
                        type="number"
                        placeholder="Min Capacity"
                        value={capacityFilter}
                        onChange={e => setCapacityFilter(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-medium">Room Name</th>
                        <th className="p-3 text-left font-medium">Type</th>
                        <th className="p-3 text-left font-medium">Building</th>
                        <th className="p-3 text-left font-medium">Floor</th>
                        <th className="p-3 text-left font-medium">Capacity</th>
                        {/* <th className="p-3 text-left font-medium">Status</th> */}
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRooms.length > 0 ? (
                        currentRooms.map(room => {
                          // const availability = checkRoomAvailability(room.name, new Date());
                          return (
                            <tr key={room.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{room.name}</td>
                              <td className="p-3">{room.room_type}</td>
                              <td className="p-3">{room.building}</td>
                              <td className="p-3">{room.floor}</td>
                              <td className="p-3">{room.capacity}</td>
                              {/* <td className="p-3">
                                <Badge variant={availability.available ? "success" : "destructive"}>
                                  {availability.available ? "Available" : "In Use"}
                                </Badge>
                              </td> */}
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditRoom(room)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    className="text-red-500 hover:text-red-700"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRoom(room.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-3 text-center">
                            {loading ? "Loading rooms..." : "No rooms found with the current filters."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {filteredRooms.length > roomsPerPage && (
                    <div className="p-3 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalPages }).map((_, index) => (
                            <PaginationItem key={index}>
                              <PaginationLink
                                isActive={currentPage === index + 1}
                                onClick={() => setCurrentPage(index + 1)}
                              >
                                {index + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Availability Tab */}
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Room Availability</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="w-full md:w-1/3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {availabilityDate ? format(availabilityDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={availabilityDate}
                          onSelect={setAvailabilityDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-1 gap-4">
                    <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Room Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Room Types</SelectItem>
                        {roomTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Min Capacity"
                      value={capacityFilter}
                      onChange={e => setCapacityFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-medium">Room Name</th>
                        <th className="p-3 text-left font-medium">Type</th>
                        <th className="p-3 text-left font-medium">Building</th>
                        <th className="p-3 text-left font-medium">Capacity</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRooms.length > 0 ? (
                        filteredRooms.map(room => {
                          const availability = checkRoomAvailability(room.name, availabilityDate);
                          return (
                            <tr key={room.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{room.name}</td>
                              <td className="p-3">{room.room_type}</td>
                              <td className="p-3">{room.building}</td>
                              <td className="p-3">{room.capacity}</td>
                              <td className="p-3">
                                <Badge variant={availability.available ? "success" : "destructive"}>
                                  {availability.available ? "Available" : "Booked"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {availability.events.length > 0 ? (
                                  <div className="space-y-2">
                                    {availability.events.map(event => (
                                      <div key={event.id} className="text-xs">
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-gray-500">
                                          {new Date(event.event_date).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {event.event_end &&
                                            new Date(event.event_end).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No events scheduled</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-3 text-center">
                            {loading ? "Loading rooms..." : "No rooms found with the current filters."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 gap-6">
              {/* Room Usage Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Usage Over Time (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={roomUsageData.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="events"
                          name="Events"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line yAxisId="right" type="monotone" dataKey="attendees" name="Attendees" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Room Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Type Distribution & Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roomTypeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="rooms" name="Total Rooms" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="events" name="Total Events" fill="#82ca9d" />
                        <Bar yAxisId="right" dataKey="utilization" name="Utilization %" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Used Rooms */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Utilized Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="p-3 text-left font-medium">Room Name</th>
                          <th className="p-3 text-left font-medium">Type</th>
                          <th className="p-3 text-left font-medium">Building</th>
                          <th className="p-3 text-left font-medium">Capacity</th>
                          <th className="p-3 text-left font-medium">Total Events</th>
                          <th className="p-3 text-left font-medium">Total Attendees</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topUsedRooms.length > 0 ? (
                          topUsedRooms.map(room => (
                            <tr key={room.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{room.name}</td>
                              <td className="p-3">{room.room_type}</td>
                              <td className="p-3">{room.building}</td>
                              <td className="p-3">{room.capacity}</td>
                              <td className="p-3">{room.eventCount}</td>
                              <td className="p-3">{room.attendeeCount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-3 text-center">
                              {loading ? "Loading data..." : "No room usage data available."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Room Add/Edit Modal */}
      <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Room Name
              </Label>
              <Input
                id="name"
                name="name"
                value={roomFormData.name}
                onChange={handleRoomFormChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_type" className="text-right">
                Room Type
              </Label>
              <Select
                value={roomFormData.room_type}
                onValueChange={value => setRoomFormData({ ...roomFormData, room_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Room Type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.length > 0 ? (
                    roomTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No room types available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="building" className="text-right">
                Building
              </Label>
              <Select
                value={roomFormData.building}
                onValueChange={value => setRoomFormData({ ...roomFormData, building: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.length > 0 ? (
                    buildings.map(building => (
                      <SelectItem key={building} value={building}>
                        {building}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No buildings available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floor" className="text-right">
                Floor
              </Label>
              <Input
                id="floor"
                name="floor"
                type="number"
                value={roomFormData.floor}
                onChange={handleRoomFormChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={roomFormData.capacity}
                onChange={handleRoomFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoom}>{currentRoom ? "Update" : "Add"} Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Mock Users component for stats
const Users = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
};

export default RoomManagementDashboard;

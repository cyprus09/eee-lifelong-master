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
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
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

  // Mock room types and buildings for filtering
  const roomTypes = ["Lecture Hall", "Tutorial Room", "Laboratory", "Meeting Room", "Auditorium"];
  const buildings = ["Main Building", "Engineering Block", "Science Center", "Research Wing"];

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
    }
  }, [rooms, events]);

  // Simulated API call to fetch rooms
  const fetchRooms = () => {
    // Simulate API response with mock data
    const mockRooms = [
      {
        id: "1",
        name: "Room 101",
        room_type: "Lecture Hall",
        building: "Main Building",
        floor: 1,
        capacity: 120,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "2",
        name: "Room 102",
        room_type: "Tutorial Room",
        building: "Main Building",
        floor: 1,
        capacity: 40,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "3",
        name: "Lab A",
        room_type: "Laboratory",
        building: "Engineering Block",
        floor: 2,
        capacity: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "4",
        name: "Conference Room 1",
        room_type: "Meeting Room",
        building: "Research Wing",
        floor: 3,
        capacity: 15,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "5",
        name: "Main Hall",
        room_type: "Auditorium",
        building: "Science Center",
        floor: 1,
        capacity: 250,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "6",
        name: "Room 201",
        room_type: "Lecture Hall",
        building: "Main Building",
        floor: 2,
        capacity: 110,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "7",
        name: "Room 202",
        room_type: "Tutorial Room",
        building: "Main Building",
        floor: 2,
        capacity: 45,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "8",
        name: "Lab B",
        room_type: "Laboratory",
        building: "Engineering Block",
        floor: 2,
        capacity: 25,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    setRooms(mockRooms);
    setFilteredRooms(mockRooms);
  };

  // Simulated API call to fetch events
  const fetchEvents = () => {
    // Mock events data
    const today = new Date();
    const mockEvents = [
      {
        id: "1",
        title: "Introduction to AI",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 0),
        venue: "Room 101",
        max_attendees: 100,
        current_attendees: 85,
        event_type: "Lecture",
        status: "upcoming",
      },
      {
        id: "2",
        title: "Digital Circuit Lab",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0),
        venue: "Lab A",
        max_attendees: 30,
        current_attendees: 28,
        event_type: "Lab Session",
        status: "upcoming",
      },
      {
        id: "3",
        title: "Faculty Meeting",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 0),
        venue: "Conference Room 1",
        max_attendees: 15,
        current_attendees: 12,
        event_type: "Meeting",
        status: "past",
      },
      {
        id: "4",
        title: "Graduation Ceremony",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 15, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 18, 0),
        venue: "Main Hall",
        max_attendees: 250,
        current_attendees: 230,
        event_type: "Ceremony",
        status: "upcoming",
      },
      {
        id: "5",
        title: "Data Structures Tutorial",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 13, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
        venue: "Room 102",
        max_attendees: 40,
        current_attendees: 35,
        event_type: "Tutorial",
        status: "upcoming",
      },
      {
        id: "6",
        title: "Research Symposium",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 10, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 17, 0),
        venue: "Room 101",
        max_attendees: 120,
        current_attendees: 95,
        event_type: "Symposium",
        status: "past",
      },
      {
        id: "7",
        title: "Electronics Workshop",
        event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 14, 0),
        event_end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 0),
        venue: "Lab A",
        max_attendees: 30,
        current_attendees: 27,
        event_type: "Workshop",
        status: "past",
      },
    ];

    setEvents(mockEvents);
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
        attendees: dayEvents.reduce((sum, event) => sum + event.current_attendees, 0),
      });
    }
    setRoomUsageData(usageData);

    // Room type distribution
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

    // Top used rooms
    const roomUsage = rooms.map(room => {
      const roomEvents = events.filter(event => event.venue === room.name);
      return {
        ...room,
        eventCount: roomEvents.length,
        attendeeCount: roomEvents.reduce((sum, event) => sum + event.current_attendees, 0),
      };
    });

    setTopUsedRooms(roomUsage.sort((a, b) => b.eventCount - a.eventCount).slice(0, 5));
  };

  // Apply filters to the rooms list
  const applyFilters = () => {
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

    if (buildingFilter) {
      filtered = filtered.filter(room => room.building === buildingFilter);
    }

    if (capacityFilter) {
      const capacity = parseInt(capacityFilter);
      filtered = filtered.filter(room => room.capacity >= capacity);
    }

    setFilteredRooms(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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
      room_type: "",
      building: "",
      floor: "",
      capacity: "",
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
  const handleSaveRoom = () => {
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

    if (currentRoom) {
      // Update existing room
      const updatedRooms = rooms.map(room =>
        room.id === currentRoom.id
          ? {
              ...room,
              name: roomFormData.name,
              room_type: roomFormData.room_type,
              building: roomFormData.building,
              floor: parseInt(roomFormData.floor),
              capacity: parseInt(roomFormData.capacity),
              updated_at: new Date(),
            }
          : room
      );
      setRooms(updatedRooms);
    } else {
      // Add new room
      const newRoom = {
        id: (rooms.length + 1).toString(), // In a real app, this would be generated by the backend
        name: roomFormData.name,
        room_type: roomFormData.room_type,
        building: roomFormData.building,
        floor: parseInt(roomFormData.floor),
        capacity: parseInt(roomFormData.capacity),
        created_at: new Date(),
        updated_at: new Date(),
      };
      setRooms([...rooms, newRoom]);
    }

    setIsRoomModalOpen(false);
  };

  // Delete a room
  const handleDeleteRoom = roomId => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
    }
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
      description: `${roomTypes.length} different types`,
    },
    {
      title: "Total Capacity",
      value: rooms.reduce((sum, room) => sum + room.capacity, 0),
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
      value: rooms.length > 0 ? Math.round((events.length / rooms.length) * 100) + "%" : "0%",
      icon: Activity,
      description: "Room usage efficiency",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-6 my-auto py-8 px-4 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Room Management Dashboard</h1>
          <Button onClick={handleAddRoom} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Room
          </Button>
        </div>

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
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRooms.length > 0 ? (
                        currentRooms.map(room => {
                          const availability = checkRoomAvailability(room.name, new Date());
                          return (
                            <tr key={room.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{room.name}</td>
                              <td className="p-3">{room.room_type}</td>
                              <td className="p-3">{room.building}</td>
                              <td className="p-3">{room.floor}</td>
                              <td className="p-3">{room.capacity}</td>
                              <td className="p-3">
                                <Badge variant={availability.available ? "success" : "destructive"}>
                                  {availability.available ? "Available" : "In Use"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditRoom(room)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRoom(room.id)}>
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
                            No rooms found with the current filters.
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
                          <Calendar className="mr-2 h-4 w-4" />
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
                      {filteredRooms.map(room => {
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
                                        -
                                        {new Date(event.event_end).toLocaleTimeString([], {
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
                      })}
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
                        {topUsedRooms.map(room => (
                          <tr key={room.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{room.name}</td>
                            <td className="p-3">{room.room_type}</td>
                            <td className="p-3">{room.building}</td>
                            <td className="p-3">{room.capacity}</td>
                            <td className="p-3">{room.eventCount}</td>
                            <td className="p-3">{room.attendeeCount}</td>
                          </tr>
                        ))}
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
                  {roomTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
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
                  {buildings.map(building => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
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

      <Footer />
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

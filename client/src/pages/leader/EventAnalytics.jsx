import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const EventAnalytics = ({ allEvents, eventStats }) => {
  const [sortField, setSortField] = useState("fillRate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  const getEventTypeColor = type => {
    const colors = {
      Social: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      Career: "bg-green-100 text-green-800 hover:bg-green-200",
      Academic: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      Cultural: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };
    return colors[type] || "bg-gray-200 text-gray-800 hover:bg-gray-300";
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

  // Process event type data for pie chart
  const getEventTypeData = () => {
    // Count events by type
    const typeCount = allEvents.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format for chart
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  };

  // Process data for registration trends
  const getRegistrationTrendData = () => {
    if (allEvents.length === 0) return [];

    // Get date range - last 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5); // Get 6 months including current

    // Create an array of months
    const monthRange = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(now),
    });

    // Initialize data with all months
    const monthlyData = monthRange.map(date => ({
      month: format(date, "MMM yyyy"),
      registrations: 0,
      events: 0,
      sortDate: date, // Used for sorting
    }));

    // Count registrations per month
    allEvents.forEach(event => {
      const eventDate = parseISO(event.event_date);
      const monthKey = format(eventDate, "MMM yyyy");

      // Find the matching month in our data array
      const monthData = monthlyData.find(item => item.month === monthKey);
      if (monthData) {
        monthData.registrations += event.current_attendees || 0;
        monthData.events += 1;
      }
    });

    // Sort by date and return without the sort field
    return monthlyData
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, registrations, events }) => ({ month, registrations, events }));
  };

  // Process data for event performance chart
  const getEventPerformanceData = () => {
    return allEvents
      .filter(e => e.max_attendees > 0)
      .map(event => ({
        name: event.title,
        fillRate: Math.round((event.current_attendees / event.max_attendees) * 100),
        type: event.event_type,
        date: format(new Date(event.event_date), "MMM d, yyyy"),
        registrations: event.current_attendees,
        capacity: event.max_attendees,
      }))
      .sort((a, b) => b.fillRate - a.fillRate)
      .slice(0, 5);
  };

  const handleSort = field => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Create sorted events array with memoization
  const sortedEvents = useMemo(() => {
    // Filter events with max_attendees > 0
    const filteredEvents = allEvents.filter(e => e.max_attendees > 0);

    // Add fill rate calculation to make sorting easier
    const eventsWithFillRate = filteredEvents.map(event => ({
      ...event,
      fillRate: (event.current_attendees / event.max_attendees) * 100,
    }));

    // Sort the events based on current sort field and direction
    return [...eventsWithFillRate].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      // Special case for event_date which needs date parsing
      if (sortField === "event_date") {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      // String comparison
      if (typeof valueA === "string") {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      // Apply sort direction
      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [allEvents, sortField, sortDirection]);

  const SortIndicator = ({ field, sortField, sortDirection }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-400 inline-flex flex-col">
          <ChevronUp size={12} />
          <ChevronDown size={12} />
        </span>
      );
    }

    return (
      <span className="ml-1 text-blue-600 inline-block">
        {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    );
  };

  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const eventTypeData = getEventTypeData();
  const registrationTrendData = getRegistrationTrendData();
  const eventPerformanceData = getEventPerformanceData();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Event Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Type</CardTitle>
            <CardDescription>Distribution of events across different categories</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {eventTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name, props) => [`${value} events`, name]}
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "4px" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No event data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
            <CardDescription>Monthly registrations over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {registrationTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "4px" }}
                    formatter={(value, name) => [value, name === "registrations" ? "Registrations" : "Events"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#0088FE"
                    activeDot={{ r: 8 }}
                    name="Registrations"
                  />
                  <Line type="monotone" dataKey="events" stroke="#00C49F" name="Events" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No registration data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Event Performance Overview</CardTitle>
          <CardDescription>Registration rates compared to maximum capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            {eventPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventPerformanceData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={value => [`${value}%`, "Fill Rate"]}
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "4px" }}
                    labelFormatter={label => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="fillRate" name="Fill Rate (%)" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {eventPerformanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fillRate > 80 ? "#4ade80" : entry.fillRate > 50 ? "#60a5fa" : "#fbbf24"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                  Event
                  <SortIndicator field="title" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("event_type")}>
                  Type
                  <SortIndicator field="event_type" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("event_date")}>
                  Date
                  <SortIndicator field="event_date" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("event_date")}>
                  Time
                  <SortIndicator field="event_date" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("current_attendees")}>
                  Registrations
                  <SortIndicator field="current_attendees" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("fillRate")}>
                  Fill Rate
                  <SortIndicator field="fillRate" sortField={sortField} sortDirection={sortDirection} />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEvents.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                  </TableCell>
                  <TableCell>{formatEventDate(event.event_date)}</TableCell>
                  <TableCell>{formatEventTime(event.event_date)}</TableCell>
                  <TableCell>
                    {event.current_attendees}/{event.max_attendees}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            event.fillRate > 80 ? "bg-green-600" : event.fillRate > 50 ? "bg-blue-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${event.fillRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs w-10 text-right">{Math.round(event.fillRate)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {sortedEvents.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, sortedEvents.length)} of{" "}
                {sortedEvents.length} events
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  <span className="ml-1">
                    <PaginationPrevious size={16} />
                  </span>
                </Button>
                <div className="flex items-center justify-center px-3 py-1 rounded text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  <span className="mr-1">
                    <PaginationNext size={16} />
                  </span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.upcomingEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.totalRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Most Popular Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.mostPopularType || "N/A"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventAnalytics;

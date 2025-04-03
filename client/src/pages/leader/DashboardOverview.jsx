import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DashboardOverview = ({ eventStats, allEvents, getEventTypeColor, formatEventDate, handleViewAttendees }) => {
  return (
    <>
      {/* Overview Stats Cards */}
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

      {/* Insights Section */}
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
    </>
  );
};

export default DashboardOverview;

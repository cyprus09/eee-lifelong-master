import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';

const EventsPage = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  const events = [
    {
      id: 1,
      title: "Batch Reunion",
      date: "2024-11-20",
      time: "14:00",
      location: "Main Campus Auditorium",
      type: "Social",
      description: "Annual reunion for the batch of 2021-2025. Join us for an evening of networking and reminiscing with your batchmates.",
      attendees: 45,
      maxCapacity: 100,
      organizer: "Alumni Association"
    },
    {
      id: 2,
      title: "Career Workshop",
      date: "2024-11-25",
      time: "10:00",
      location: "Virtual Meeting",
      type: "Career",
      description: "Interactive workshop on emerging career opportunities in electrical engineering. Industry experts will share insights and tips.",
      attendees: 120,
      maxCapacity: 200,
      organizer: "Career Development Cell"
    },
    {
      id: 3,
      title: "Alumni Meet",
      date: "2024-12-01",
      time: "16:00",
      location: "College Gardens",
      type: "Social",
      description: "Annual alumni gathering with special presentations from distinguished alumni and networking opportunities.",
      attendees: 75,
      maxCapacity: 150,
      organizer: "Alumni Relations Office"
    }
  ];

  const getEventTypeColor = (type) => {
    const colors = {
      Social: "bg-blue-100 text-blue-800",
      Career: "bg-green-100 text-green-800",
      Academic: "bg-purple-100 text-purple-800",
      Cultural: "bg-yellow-100 text-yellow-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Calendar and Filters */}
          <div className="w-full md:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={getEventTypeColor("Social")}>Social</Badge>
                  <Badge className={getEventTypeColor("Career")}>Career</Badge>
                  <Badge className={getEventTypeColor("Academic")}>Academic</Badge>
                  <Badge className={getEventTypeColor("Cultural")}>Cultural</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events List */}
          <div className="flex-1">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="registered">Registered</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-6">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                        </div>
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-600">{event.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{event.attendees}/{event.maxCapacity} attending</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                          <div className="text-sm text-gray-600">
                            Organized by: {event.organizer}
                          </div>
                          <Button>Register Now</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="past">
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      Past events will be shown here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="registered">
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      Your registered events will appear here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
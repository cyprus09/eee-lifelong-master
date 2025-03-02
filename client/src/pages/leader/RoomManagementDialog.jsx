import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MapPin, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { supabase } from "../../lib/supabaseClient";

const RoomManagementDialog = ({ isOpen, onClose, onRoomSelect, selectedDate = new Date() }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const response = await fetch(`http://localhost:8080/api/rooms/available?date=${formattedDate}`, {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch available rooms");
      }

      const data = await response.json();
      console.log("Available rooms:", data); // Debug log
      setRooms(data);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen, selectedDate, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getRoomTypeColor = type => {
    const colors = {
      classroom: "bg-blue-100 text-blue-800",
      lab: "bg-green-100 text-green-800",
      auditorium: "bg-purple-100 text-purple-800",
      meeting_room: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Available Rooms</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="font-medium">{selectedDate ? format(selectedDate, "PPP") : "Select a date"}</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-4">Loading rooms...</div>
          ) : (
            !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No available rooms found for this date. Try another date.
                  </div>
                ) : (
                  rooms.map(room => (
                    <Card
                      key={room.id || `room-${Math.random()}`}
                      className="hover:shadow-md transition-shadow border-green-200"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <h3 className="font-semibold">{room.name || "Unnamed Room"}</h3>
                          <Badge className={getRoomTypeColor(room.room_type || "unknown")}>
                            {(room.room_type || "unknown").replace("_", " ")}
                          </Badge>
                        </div>
                        <Button onClick={() => onRoomSelect(room)}>Select</Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {room.building || "Unknown"}, Floor {room.floor || "?"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Capacity: {room.capacity || "?"} people</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomManagementDialog;

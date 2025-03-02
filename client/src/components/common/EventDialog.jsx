import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Share2, Calendar, X, Info } from "lucide-react";

const EventDetailsDialog = ({ isOpen, setIsOpen, event, setIsRegisterDialogOpen }) => {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);

  if (!event) return null;

  const isUpcoming = event.status === "upcoming";
  const isFull = event.current_attendees >= event.max_attendees;

  const getEventTypeColor = type => {
    const colors = {
      Social: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      Career: "bg-green-100 text-green-800 hover:bg-green-200",
      Academic: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      Cultural: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };
    return colors[type] || "bg-gray-200 text-gray-800 hover:bg-gray-300";
  };

  const getStatusColor = status => {
    const colors = {
      upcoming: "bg-green-100 text-green-800 hover:bg-green-200",
      past: "bg-gray-100 text-gray-800 hover:bg-gray-300",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
            <div className="flex gap-2">
              <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
            </div>
          </div>
          <DialogDescription className="text-base mt-2">{event.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event details section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-gray-600">{formatEventDate(event.event_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Attendance</p>
                  <p className="text-gray-600">
                    {event.current_attendees}/{event.max_attendees} seats filled
                    {isFull && <span className="text-red-500 ml-2">(Event Full)</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Additional Info</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={() => setIsAdditionalInfoOpen(true)}
                  >
                    View details
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Event agenda or highlights if available */}
          {event.agenda && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Agenda</h3>
              <ul className="list-disc pl-5 space-y-1">
                {event.agenda.map((item, index) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Event gallery or featured image if available */}
          {event.images && event.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {event.images.map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <img src={image} alt={`${event.title} image ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between gap-4 mt-4 items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: "EEE Cultural Night",
                      text: "Annual cultural celebration featuring performances by EEE students and alumni.",
                      url: window.location.href,
                    })
                    .catch(error => console.log("Error sharing:", error));
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {isUpcoming && (
            <Button
              disabled={isFull}
              onClick={() => {
                setIsOpen(false);
                setIsRegisterDialogOpen(true);
              }}
            >
              {isFull ? "Event Full" : "Register Now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Additional Information Dialog */}
      <Dialog open={isAdditionalInfoOpen} onOpenChange={setIsAdditionalInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Additional Information</DialogTitle>
            <DialogDescription>Extra details about the {event.title} event.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Organizer information */}
            <div>
              <h4 className="font-medium">Organized by</h4>
              <p className="text-gray-700">{event.organizer || "Lifelong Learning @EEE"}</p>
            </div>

            <div>
              <h4 className="font-medium">Contact Information</h4>
              <p className="text-gray-700">{event.contact_email || "eee_msc@ntu.edu.sg"}</p>
              <p className="text-gray-700">{event.contact_phone || "(+65) 6790-6324"}</p>
            </div>

            {/* Additional notes */}
            <div>
              <h4 className="font-medium">Notes</h4>
              <p className="text-gray-700">
                {event.additional_notes ||
                  "Please arrive 15 minutes before the event starts. Refreshments will be provided."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdditionalInfoOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default EventDetailsDialog;

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Share2, Calendar, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import careerImage from "../../assets/event_types/career.jpg";
import socialImage from "../../assets/event_types/social.jpg";
import academicImage from "../../assets/event_types/academic.jpg";
import culturalImage from "../../assets/event_types/cultural.jpg";

const EventDetailsDialog = ({ isOpen, setIsOpen, event, setIsRegisterDialogOpen }) => {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const { toast } = useToast();

  if (!event) return null;

  const isUpcoming = event.status === "upcoming";
  const isFull = event.current_attendees >= event.max_attendees;

  // Generate a shareable URL for this specific event
  const generateShareableUrl = () => {
    // Get the base URL of your site
    const baseUrl = window.location.origin;

    return `${baseUrl}/events?id=${event.id}`;
  };

  const handleShare = async () => {
    const shareUrl = generateShareableUrl();
    const shareTitle = event.title;
    const shareText = `Check out this event: ${event.title} - ${event.description?.substring(0, 100)}${
      event.description?.length > 100 ? "..." : ""
    }`;

    try {
      if (navigator.share) {
        // Use the Web Share API if available (mobile devices)
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });

        toast({
          title: "Shared successfully",
          description: "The event link has been shared.",
        });
      } else {
        // Fallback for desktop browsers
        await navigator.clipboard.writeText(shareUrl);

        toast({
          title: "Link copied",
          description: "Event link copied to clipboard!",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);

      // Only show toast for errors that aren't from the user canceling the share
      if (error.name !== "AbortError") {
        toast({
          title: "Share failed",
          description: "Could not share the event link.",
          variant: "destructive",
        });
      }
    }
  };

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

  const getEventTypeImage = eventType => {
    if (!eventType) return null;

    const formattedType = eventType.toString().trim();
    const capitalizedType = formattedType.charAt(0).toUpperCase() + formattedType.slice(1).toLowerCase();

    switch (capitalizedType) {
      case "Cultural":
        return culturalImage;
      case "Social":
        return socialImage;
      case "Academic":
        return academicImage;
      case "Career":
        return careerImage;
      default:
        console.log("No matching image for event type:", eventType);
        return null;
    }
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
          {event.event_type && (
            <div className="mb-4">
              {getEventTypeImage(event.event_type) ? (
                <img
                  src={getEventTypeImage(event.event_type)}
                  alt={`${event.event_type} event`}
                  className="w-full h-48 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-md">
                  <p className="text-gray-500">No image available for {event.event_type}</p>
                </div>
              )}
            </div>
          )}
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
                  <p className="text-gray-600">
                    {formatEventDate(event.event_date)} - {formatEventDate(event.event_end)}
                  </p>
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
        </div>

        <DialogFooter className="flex sm:justify-between gap-4 mt-4 items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleShare}>
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

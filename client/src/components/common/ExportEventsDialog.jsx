import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import "jspdf-autotable";

const ExportEventsDialog = ({ isOpen, onClose, events }) => {
  const [dateFilter, setDateFilter] = useState({
    enabled: false,
    startMonth: "1",
    startYear: "2025",
    endMonth: "12",
    endYear: "2025",
  });

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2023", "2024", "2025", "2026"];

  // Filter events based on date range if enabled
  const getFilteredEvents = () => {
    if (!dateFilter.enabled) return events;

    if (!events || events.length === 0) return [];

    const startDate = new Date(`${dateFilter.startYear}-${dateFilter.startMonth}-01`);
    const endDate = new Date(`${dateFilter.endYear}-${dateFilter.endMonth}-31`);

    return events.filter(event => {
      // Check if event has event_date property
      if (!event.event_date) {
        console.warn("Event missing event_date property:", event);
        return false;
      }

      try {
        // Parse event_date from the API data
        const eventDate = new Date(event.event_date);

        // Skip invalid dates
        if (isNaN(eventDate.getTime())) {
          console.warn("Invalid date for event:", event);
          return false;
        }

        return eventDate >= startDate && eventDate <= endDate;
      } catch (error) {
        console.error("Error parsing date for event:", event, error);
        return false;
      }
    });
  };

  const handleExportData = format => {
    const filteredEvents = getFilteredEvents();

    if (!filteredEvents || filteredEvents.length === 0) {
      toast({
        title: "Export Failed",
        description: "No event data available to export",
        variant: "destructive",
      });
      return;
    }

    const filename = `event-data-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(filteredEvents, filename);
    } else if (format === "pdf") {
      exportToPDF(filteredEvents, filename);
    }

    onClose();

    toast({
      title: "Export Complete",
      description: `Events exported as ${format.toUpperCase()} successfully!`,
    });
  };

  // Function to export data as CSV
  const exportToCSV = (events, filename) => {
    // Format the data for CSV - matching your data structure
    const formattedEvents = events.map(event => ({
      "Event Title": event.title || "",
      Type: event.event_type || "",
      Date: formatEventDate(event.event_date) || "",
      Time: formatEventTime(event.event_date) || "",
      Venue: event.venue || "",
      Registrations: `${event.current_attendees || 0}/${event.max_attendees || 0}`,
      Status: event.status || "",
    }));

    // Create a worksheet
    const worksheet = utils.json_to_sheet(formattedEvents);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Events");

    // Generate CSV file and trigger download
    const excelBuffer = write(workbook, { bookType: "csv", type: "array" });
    const data = new Blob([excelBuffer], { type: "text/csv;charset=utf-8" });
    saveAs(data, `${filename}.csv`);
  };

  // Function to export data as PDF
  const exportToPDF = (events, filename) => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Event Management Data", 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare the table data
      const tableColumn = ["Event Title", "Type", "Date", "Venue", "Registrations", "Status"];
      const tableRows = events.map(event => [
        event.title || "",
        event.event_type || "",
        new Date(event.event_date).toLocaleDateString() || "",
        event.venue || "",
        `${event.current_attendees || 0}/${event.max_attendees || 0}`,
        event.status || "",
      ]);

      // Set up table parameters
      let yPos = 40; // Starting y position
      const xPos = 14; // Starting x position
      const rowHeight = 10;
      const colWidths = [40, 25, 30, 35, 30, 25]; // Width of each column

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");

      let currentXPos = xPos;
      tableColumn.forEach((header, i) => {
        doc.text(header, currentXPos, yPos);
        currentXPos += colWidths[i];
      });

      yPos += 2;
      doc.line(xPos, yPos, currentXPos - 10, yPos);
      yPos += 6;

      doc.setFont(undefined, "normal");

      tableRows.forEach(row => {
        currentXPos = xPos;

        row.forEach((cell, i) => {
          const cellText = String(cell);
          if (doc.getStringUnitWidth(cellText) * 10 > colWidths[i] - 4) {
            let fitText = cellText;
            while (doc.getStringUnitWidth(fitText + "...") * 10 > colWidths[i] - 4 && fitText.length > 3) {
              fitText = fitText.substring(0, fitText.length - 1);
            }
            doc.text(fitText + "...", currentXPos, yPos);
          } else {
            doc.text(cellText, currentXPos, yPos);
          }

          currentXPos += colWidths[i];
        });

        yPos += rowHeight;

        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Save the PDF
      doc.save(`${filename}.pdf`);

      toast({
        title: "Export Complete",
        description: "Events exported as PDF successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was a problem generating the PDF file.",
        variant: "destructive",
      });
    }
  };

  // Format date for display (using your formatting function)
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

  // Format time for display (using your formatting function)
  const formatEventTime = dateString => {
    if (!dateString || dateString === "0001-01-01T00:00:00Z") {
      return "Time not set";
    }
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Event Data</DialogTitle>
          <DialogDescription>Choose a format to export your event data</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="format">Export Format</TabsTrigger>
            <TabsTrigger value="filter">Date Filter</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => handleExportData("csv")}
              >
                <Download className="h-8 w-8 mb-2" />
                CSV Format
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => handleExportData("pdf")}
              >
                <Download className="h-8 w-8 mb-2" />
                PDF Format
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="filter" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-toggle"
                checked={dateFilter.enabled}
                onCheckedChange={checked => setDateFilter({ ...dateFilter, enabled: checked })}
              />
              <Label htmlFor="filter-toggle">Filter by date range</Label>
            </div>

            {dateFilter.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={dateFilter.startMonth}
                        onValueChange={value => setDateFilter({ ...dateFilter, startMonth: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={dateFilter.startYear}
                        onValueChange={value => setDateFilter({ ...dateFilter, startYear: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={dateFilter.endMonth}
                        onValueChange={value => setDateFilter({ ...dateFilter, endMonth: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={dateFilter.endYear}
                        onValueChange={value => setDateFilter({ ...dateFilter, endYear: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {dateFilter.enabled && (
                    <p>
                      Currently showing events from {months.find(m => m.value === dateFilter.startMonth)?.label}{" "}
                      {dateFilter.startYear}
                      to {months.find(m => m.value === dateFilter.endMonth)?.label} {dateFilter.endYear}
                    </p>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportEventsDialog;

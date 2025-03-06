import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import autoTable from "jspdf-autotable";

const ExportAttendeesDialog = ({ isOpen, onClose, attendees, eventTitle }) => {
  // Function to export attendee data as CSV
  const exportToCSV = (attendees, filename) => {
    // Format the data for CSV
    const formattedAttendees = attendees.map(attendee => ({
      "Attendee Name": attendee.name || "",
      Email: attendee.email || "",
      "Registration Date": formatDate(attendee.registration_date) || "",
    }));

    // Create a worksheet
    const worksheet = utils.json_to_sheet(formattedAttendees);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Attendees");

    // Generate CSV file and trigger download
    const excelBuffer = write(workbook, { bookType: "csv", type: "array" });
    const data = new Blob([excelBuffer], { type: "text/csv;charset=utf-8" });
    saveAs(data, `${filename}.csv`);
  };

  // Function to export attendee data as PDF
  const exportToPDF = (attendees, filename) => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text(`Attendee List: ${eventTitle || "Event"}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Attendees: ${attendees.length}`, 14, 38);

      // Create the table with attendee data
      autoTable(doc, {
        startY: 45,
        head: [["Name", "Email", "Registration Date"]],
        body: attendees.map(attendee => [
          attendee.name || "",
          attendee.email || "",
          formatDate(attendee.registration_date) || "",
        ]),
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 10 },
      });

      // Save the PDF
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was a problem generating the PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = format => {
    if (!attendees || attendees.length === 0) {
      toast({
        title: "Export Failed",
        description: "No attendee data available to export",
        variant: "destructive",
      });
      return;
    }

    const sanitizedEventTitle = (eventTitle || "event-attendees").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const filename = `${sanitizedEventTitle}-attendees-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(attendees, filename);
    } else if (format === "pdf") {
      exportToPDF(attendees, filename);
    }

    onClose();

    toast({
      title: "Export Complete",
      description: `Attendee list exported as ${format.toUpperCase()} successfully!`,
    });
  };

  // Helper function to format date
  const formatDate = dateString => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Attendee List</DialogTitle>
          <DialogDescription>Choose a format to export the attendee data</DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportAttendeesDialog;

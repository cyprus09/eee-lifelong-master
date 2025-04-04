import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// SortIndicator component to show sorting direction
const SortIndicator = ({ field, sortField, sortDirection }) => {
  if (field !== sortField) return null;

  return sortDirection === "asc" ? (
    <ChevronUp className="ml-1 h-4 w-4 inline" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4 inline" />
  );
};

const TopUtilizedRooms = ({ topUsedRooms, loading }) => {
  // State for sorting
  const [sortField, setSortField] = useState("attendeeCount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortedRooms, setSortedRooms] = useState([]);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [roomsPerPage] = useState(5); // Show more rooms per page

  // Sort rooms whenever sort parameters or rooms data changes
  useEffect(() => {
    if (topUsedRooms && topUsedRooms.length > 0) {
      const sorted = [...topUsedRooms].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Ensure numeric sorting for capacity and counts
        if (sortField === "capacity" || sortField === "eventCount" || sortField === "attendeeCount") {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }
        // Handle string comparisons
        else if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      setSortedRooms(sorted);
    } else {
      setSortedRooms([]);
    }
  }, [topUsedRooms, sortField, sortDirection]);

  // Calculate pagination values
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = sortedRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(sortedRooms.length / roomsPerPage);

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle sorting
  const handleSort = field => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // For numeric fields, default to descending (largest first)
      if (field === "capacity" || field === "eventCount" || field === "attendeeCount") {
        setSortDirection("desc");
      } else {
        setSortDirection("asc"); // For text fields, default to ascending (A-Z)
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("name")}>
                  Room Name
                  <SortIndicator field="name" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("room_type")}>
                  Type
                  <SortIndicator field="room_type" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("building")}>
                  Building
                  <SortIndicator field="building" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("capacity")}>
                  Capacity
                  <SortIndicator field="capacity" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("eventCount")}>
                  Total Events
                  <SortIndicator field="eventCount" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort("attendeeCount")}>
                  Total Attendees
                  <SortIndicator field="attendeeCount" sortField={sortField} sortDirection={sortDirection} />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentRooms.length > 0 ? (
                currentRooms.map(room => (
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

        {/* Pagination Controls */}
        {sortedRooms.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstRoom + 1} to {Math.min(indexOfLastRoom, sortedRooms.length)} of {sortedRooms.length}{" "}
              rooms
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                <PaginationPrevious size={16} />
              </Button>
              <div className="flex items-center justify-center px-3 py-1 rounded text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                <PaginationNext size={16} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopUtilizedRooms;

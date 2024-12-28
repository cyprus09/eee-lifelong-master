import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../../contexts/AuthContext";

const ProfilePage = () => {
  const { user } = useAuth();

  const [userData, setUserData] = React.useState({
    username: user?.user_metadata?.full_name,
    firstName: "Mayank",
    lastName: "Pallai",
    email: user?.user_metadata?.email,
    batch: "2021-2025",
    course: "Electrical Engineering",
    gender: "",
    avatarUrl: "",
  });

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
              <Button variant="outline">Save Changes</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatarUrl} />
                  <AvatarFallback className="text-2xl">{userData.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Photo</Button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={userData.firstName}
                    onChange={e => handleInputChange("firstName", e.target.value)}
                    placeholder="Your First Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={userData.lastName}
                    onChange={e => handleInputChange("lastName", e.target.value)}
                    placeholder="Your Last Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={userData.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch</label>
                  <Input
                    value={userData.batch}
                    onChange={e => handleInputChange("batch", e.target.value)}
                    placeholder="2021-2025"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Input
                  value={userData.course}
                  onChange={e => handleInputChange("course", e.target.value)}
                  placeholder="Your Course"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer/>
    </div>
  );
};

export default ProfilePage;

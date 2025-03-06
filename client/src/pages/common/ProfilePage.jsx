import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Camera, GraduationCap } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: "Mayank Pallai",
    firstName: "Mayank",
    lastName: "Pallai",
    email: "mayank@example.com",
    batch: "2021-2025",
    course: "Electrical Engineering",
    bio: "Passionate about technology and innovation",
    location: "Singapore, Singapore",
    linkedin: "linkedin.com/in/mayank",
    github: "github.com/cyprus09",
    skills: ["C/C++", "React", "Machine Learning"],
    interests: ["Robotics", "AI", "Web Development"],
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
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <Button>Save Changes</Button>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="social">Social & Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={userData.avatarUrl} />
                        <AvatarFallback className="text-4xl bg-primary/10">
                          {userData.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">First Name</label>
                          <Input
                            value={userData.firstName}
                            onChange={e => handleInputChange("firstName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Last Name</label>
                          <Input
                            value={userData.lastName}
                            onChange={e => handleInputChange("lastName", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <Input
                          value={userData.bio}
                          onChange={e => handleInputChange("bio", e.target.value)}
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            value={userData.email}
                            onChange={e => handleInputChange("email", e.target.value)}
                            type="email"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Input
                            value={userData.location}
                            onChange={e => handleInputChange("location", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center space-x-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Academic Information</h3>
                      <p className="text-sm text-gray-500">Your educational background</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Batch</label>
                      <Input value={userData.batch} disabled />
                      <p className="text-xs text-gray-500">Contact admin to update batch info</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Course</label>
                      <Input value={userData.course} disabled />
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Academic details are managed by administrators. Please contact support for any changes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">LinkedIn Profile</label>
                      <Input
                        value={userData.linkedin}
                        onChange={e => handleInputChange("linkedin", e.target.value)}
                        placeholder="Your LinkedIn URL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">GitHub Profile</label>
                      <Input
                        value={userData.github}
                        onChange={e => handleInputChange("github", e.target.value)}
                        placeholder="Your GitHub URL"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {userData.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;

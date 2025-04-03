import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, GraduationCap, Loader2, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: "",
    displayName: "",
    email: "",
    batch_year: null,
    course: "Electrical Engineering",
    bio: "",
    linkedin: "",
    github: "",
    skills: [],
    interests: [],
  });

  const [preferences, setPreferences] = useState({
    events_enabled: true,
    event_types: ["workshop", "social", "academic", "career"],
    email_frequency: "immediate",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch basic user data first
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError("");

      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not logged in");

      // Store the user ID for later use
      setUserId(user.id);

      // Set initial data from auth
      setUserData(prev => ({
        ...prev,
        email: user.email || "",
        // Get display name from user metadata or email
        displayName: user.user_metadata?.full_name || user.email.split("@")[0],
      }));

      // Now try to fetch additional profile data
      fetchProfileData(user.id);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load basic user data. Please try again later.");
      setLoading(false);
    }
  };

  // Separate function to fetch profile-specific data
  const fetchProfileData = async userId => {
    try {
      // Use a simple, limited query to avoid recursion
      const { data, error } = await supabase
        .from("profiles")
        .select("username, notification_preferences, batch_year")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Could not fetch profile data:", error);
        // Continue with limited data, don't throw here
      } else if (data) {
        // Update preferences if available
        if (data.notification_preferences) {
          setPreferences(data.notification_preferences);
        }

        // Update other fields
        setUserData(prev => ({
          ...prev,
          batch_year: data.batch_year || "2025",
        }));
      }
    } catch (error) {
      console.error("Error in profile data fetch:", error);
      // Don't set error message here to allow partial functionality
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleEvents = checked => {
    setPreferences({
      ...preferences,
      events_enabled: checked,
    });
  };

  const handleToggleEventType = (type, checked) => {
    const currentTypes = [...preferences.event_types];
    if (!checked && currentTypes.includes(type)) {
      setPreferences({
        ...preferences,
        event_types: currentTypes.filter(t => t !== type),
      });
    } else if (checked && !currentTypes.includes(type)) {
      setPreferences({
        ...preferences,
        event_types: [...currentTypes, type],
      });
    }
  };

  const handleFrequencyChange = value => {
    setPreferences({
      ...preferences,
      email_frequency: value,
    });
  };

  const savePreferences = async () => {
    if (!userId) {
      setError("User session not found. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      // Update only the notification_preferences field in the profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          notification_preferences: preferences,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) {
      setError("User session not found. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      // Only update the username field for now
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: userData.username,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const eventTypes = [
    { id: "workshop", label: "Workshop" },
    { id: "social", label: "Social" },
    { id: "academic", label: "Academic" },
    { id: "career", label: "Career" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-500" />
            <p className="mt-4 text-lg text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="social">Social & Skills</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={userData.avatarUrl} />
                        <AvatarFallback className="text-4xl bg-primary/10">
                          {userData.displayName ? userData.displayName.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input
                          value={userData.displayName}
                          onChange={e => handleInputChange("displayName", e.target.value)}
                          placeholder="How you want to be known"
                        />
                      </div>
{/* 
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={userData.username}
                          onChange={e => handleInputChange("username", e.target.value)}
                          placeholder="Choose a username (at least 3 characters)"
                          minLength={3}
                        />
                        <p className="text-xs text-gray-500">This will be your unique identifier for the platform</p>
                      </div> */}

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
                          <Input value={userData.email} type="email" disabled />
                          <p className="text-xs text-gray-500">Contact admin to update email</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic tab */}
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
                      <label className="text-sm font-medium">Batch Year</label>
                      <Input value={userData.batch_year || "2025"} disabled />
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

            {/* Social tab */}
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
                      {userData.skills.length > 0 ? (
                        userData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No skills added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {userData.interests.length > 0 ? (
                        userData.interests.map((interest, index) => (
                          <Badge key={index} variant="outline">
                            {interest}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No interests added yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Bell className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl font-semibold">Notification Preferences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="events-toggle" className="font-medium">
                      Receive event notifications
                    </Label>
                    <Switch
                      id="events-toggle"
                      checked={preferences.events_enabled}
                      onCheckedChange={handleToggleEvents}
                    />
                  </div>
                  {preferences.events_enabled && (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Event Types</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {eventTypes.map(type => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`event-type-${type.id}`}
                                checked={preferences.event_types.includes(type.id)}
                                onCheckedChange={checked => handleToggleEventType(type.id, checked)}
                              />
                              <Label htmlFor={`event-type-${type.id}`} className="cursor-pointer">
                                {type.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Email Frequency</h3>
                        <Select value={preferences.email_frequency} onValueChange={handleFrequencyChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Digest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="pt-4">
                    <Button onClick={savePreferences} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
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

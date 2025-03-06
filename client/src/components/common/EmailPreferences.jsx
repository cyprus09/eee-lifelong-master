import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    events_enabled: true,
    event_types: ["workshop", "social", "academic", "career"],
    email_frequency: "immediate",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not logged in");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data && data.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoading(false);
    }
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
    try {
      setSaving(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not logged in");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          notification_preferences: preferences,
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading preferences...</span>
      </div>
    );
  }

  const eventTypes = [
    { id: "workshop", label: "Workshop" },
    { id: "social", label: "Social" },
    { id: "academic", label: "Academic" },
    { id: "career", label: "Career" },
  ];

  return (
    <Card className="max-w-xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Notification Preferences</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="events-toggle" className="font-medium">
            Receive event notifications
          </Label>
          <Switch id="events-toggle" checked={preferences.events_enabled} onCheckedChange={handleToggleEvents} />
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
          <Button className="w-full" onClick={savePreferences} disabled={saving}>
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

        {message && (
          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;

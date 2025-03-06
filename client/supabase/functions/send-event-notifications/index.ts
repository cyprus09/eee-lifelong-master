// supabase/functions/send-event-notifications/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface EmailNotification {
  id: string;
  event_id: string;
  notification_type: "created" | "updated" | "cancelled";
  event_data: {
    id: string;
    title: string;
    description: string;
    event_date: string;
    venue: string;
    max_attendees: number;
    event_type: string;
  };
  created_at: string;
  processed: boolean;
}

serve(async req => {
  try {
    // Create a Supabase client with the admin role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get unprocessed notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from("email_notifications")
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: "No pending notifications" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Processing ${notifications.length} notifications...`);

    // Get all users who should receive notifications
    const { data: users, error: usersError } = await supabaseClient
      .from("user_profiles")
      .select("id, email, notification_preferences")
      .eq("notification_preferences.events_enabled", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Process each notification
    const results = await Promise.all(
      notifications.map(async (notification: EmailNotification) => {
        try {
          // Generate email content based on notification type
          const emailSubject = getEmailSubject(notification);
          const emailContent = getEmailContent(notification);

          // Send emails to all users
          for (const user of users) {
            // Here you would integrate with your email service provider
            // For example, SendGrid, Mailgun, etc.
            await sendEmail(user.email, emailSubject, emailContent);
          }

          // Mark notification as processed
          const { error: updateError } = await supabaseClient
            .from("email_notifications")
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .eq("id", notification.id);

          if (updateError) {
            throw updateError;
          }

          return { id: notification.id, status: "success" };
        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error);
          return { id: notification.id, status: "error", error };
        }
      })
    );

    return new Response(JSON.stringify({ processed: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper functions for email generation
function getEmailSubject(notification: EmailNotification): string {
  const { title } = notification.event_data;
  switch (notification.notification_type) {
    case "created":
      return `New Event: ${title}`;
    case "updated":
      return `Event Updated: ${title}`;
    case "cancelled":
      return `Event Cancelled: ${title}`;
    default:
      return `Event Notification: ${title}`;
  }
}

function getEmailContent(notification: EmailNotification): string {
  const { title, description, event_date, venue, event_type } = notification.event_data;
  const date = new Date(event_date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let content = "";

  switch (notification.notification_type) {
    case "created":
      content = `
        <h2>New Event: ${title}</h2>
        <p>A new event has been created.</p>
      `;
      break;
    case "updated":
      content = `
        <h2>Event Updated: ${title}</h2>
        <p>An event you might be interested in has been updated.</p>
      `;
      break;
    case "cancelled":
      content = `
        <h2>Event Cancelled: ${title}</h2>
        <p>Unfortunately, an event you might have been interested in has been cancelled.</p>
      `;
      break;
  }

  content += `
    <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
      <h3>${title}</h3>
      <p><strong>Type:</strong> ${event_type}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Venue:</strong> ${venue || "TBA"}</p>
      <p><strong>Description:</strong><br>${description || "No description provided."}</p>
      <p><a href="YOUR_FRONTEND_URL/events/${
        notification.event_id
      }" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">View Event Details</a></p>
    </div>
    <p style="margin-top: 20px; color: #666; font-size: 0.9em;">You're receiving this email because you've subscribed to event notifications. You can update your preferences in your account settings.</p>
  `;

  return content;
}

// Function to send email (placeholder - integrate with your email service)
async function sendEmail(to: string, subject: string, htmlContent: string) {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'mayankku001@e.ntu.edu.sg', name: 'LifeLong@EEE' },
      subject,
      content: [{ type: 'text/html', value: htmlContent }],
    }),
  });

  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);

  return true;
}

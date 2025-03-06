-- Create a function to handle event notifications
CREATE OR REPLACE FUNCTION public.handle_event_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  event_data JSONB;
BEGIN
  -- Determine notification type
  IF TG_OP = 'INSERT' THEN
    notification_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Special case for cancellation
    IF NEW.status = 'cancelled' AND OLD.status = 'upcoming' THEN
      notification_type := 'cancelled';
    ELSE
      notification_type := 'updated';
    END IF;
  END IF;
  
  -- Prepare event data
  event_data := jsonb_build_object(
    'id', NEW.id,
    'title', NEW.title,
    'description', NEW.description,
    'event_date', NEW.event_date,
    'venue', NEW.venue,
    'max_attendees', NEW.max_attendees,
    'event_type', NEW.event_type,
    'notification_type', notification_type
  );
  
  -- Queue notification by inserting into a notifications table
  INSERT INTO public.email_notifications (
    event_id,
    notification_type,
    event_data,
    processed
  ) VALUES (
    NEW.id,
    notification_type,
    event_data,
    FALSE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table to store notification queue
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id),
  notification_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create trigger for INSERT operations
CREATE TRIGGER event_created_notification
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_event_notification();

-- Create trigger for UPDATE operations
CREATE TRIGGER event_updated_notification
AFTER UPDATE ON public.events
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.handle_event_notification();
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RegisterDialog = ({ isOpen, onClose }) => {
  const handleConfirm = () => {
    console.log("User registered successfully");
    onClose(); 
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={open => open || onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Registration?</AlertDialogTitle>
          <AlertDialogDescription>
            By confirming, you will be registered for the event. You can cancel anytime before the event starts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RegisterDialog;

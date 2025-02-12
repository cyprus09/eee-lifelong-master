import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const landings = [
  {
    id: nanoid(),
    title: "Landing 01",
    route: "/project-management",
  },
  {
    id: nanoid(),
    title: "Landing 02",
    route: "/crm-landing",
  },
  {
    id: nanoid(),
    title: "Landing 03",
    route: "/ai-content-landing",
  },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await signOut();

      if (error) throw error;

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Card className="container sticky top-4 bg-card py-3 px-4 border-0 flex flex-col rounded-2xl my-auto mx-auto z-10">
      <div className="flex items-center justify-between gap-6">
        <Home onClick={() => navigate("/home")} className="text-primary cursor-pointer" size={24} />
        <ul className="hidden md:flex gap-10 text-card-foreground">
          <li className="text-primary font-medium">
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="#faqs">FAQs</Link>
          </li>
          <li>
            <Link to="/events">Events</Link>
          </li>
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>

        <div className="flex items-center">
          <Button variant="secondary" className="hidden md:block px-2" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>

          {/* Mobile menu */}
          <div className="flex md:hidden mr-2 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5 rotate-0 scale-100" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link to="/" className="w-full">
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="#faqs" className="w-full">
                    FAQs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/events" className="w-full">
                    Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/admin" className="w-full">
                    Admin
                  </Link>
                </DropdownMenuItem>
                {user ? (
                  <DropdownMenuItem>
                    <Button
                      variant="secondary"
                      className="w-full text-sm"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Link to="/login" className="w-full">
                        <Button variant="secondary" className="w-full text-sm">
                          Login
                        </Button>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/register" className="w-full">
                        <Button className="w-full text-sm">Register</Button>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Navbar;

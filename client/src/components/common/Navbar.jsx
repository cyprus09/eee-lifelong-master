import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Home, Calendar, Users, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, userRole, isStudentLeader } = useAuth();
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

  const isActive = path => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Card className="container sticky top-4 bg-card py-3 px-4 border-0 flex flex-col rounded-2xl my-auto mx-auto z-10">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Home onClick={() => navigate("/home")} className="text-primary cursor-pointer" size={24} />
          <span className="font-semibold text-primary hidden sm:inline-block">Lifelong@EEE </span>
        </div>

        <ul className="hidden md:flex gap-10 text-card-foreground">
          <li className={isActive("/") ? "text-primary font-medium" : ""}>
            <Link to="/">Home</Link>
          </li>
          <li className={isActive("#faqs") ? "text-primary font-medium" : ""}>
            <Link to="#faqs">FAQs</Link>
          </li>
          <li className={isActive("/events") ? "text-primary font-medium" : ""}>
            <Link to="/events" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Events
            </Link>
          </li>

          {isStudentLeader() && (
            <li className={isActive("/leader/dashboard") ? "text-primary font-medium" : ""}>
              <Link to="/leader/dashboard" className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </li>
          )}

          {userRole === "admin" && (
            <li className={isActive("/admin") ? "text-primary font-medium" : ""}>
              <Link to="/admin">Admin</Link>
            </li>
          )}
        </ul>

        <div className="flex items-center">
          {user && (
            <span className="hidden md:flex items-center gap-2 mr-4">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-sm hidden lg:inline-block">
                {isStudentLeader() ? "Leader" : userRole === "admin" ? "Admin" : "Student"}
              </span>
            </span>
          )}

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
                  <Link to="/" className="w-full flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="#faqs" className="w-full">
                    FAQs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/events" className="w-full flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events
                  </Link>
                </DropdownMenuItem>

                {/* Conditional mobile navigation based on user role */}
                {isStudentLeader() && (
                  <DropdownMenuItem>
                    <Link to="/leader/dashboard" className="w-full flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Leader Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                {userRole === "admin" && (
                  <DropdownMenuItem>
                    <Link to="/admin" className="w-full">
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}

                {user ? (
                  <>
                    <DropdownMenuItem>
                      <div className="w-full flex items-center justify-between">
                        <span className="text-sm">{user.email}</span>
                        <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                          {isStudentLeader() ? "Leader" : userRole === "admin" ? "Admin" : "Student"}
                        </span>
                      </div>
                    </DropdownMenuItem>
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
                  </>
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

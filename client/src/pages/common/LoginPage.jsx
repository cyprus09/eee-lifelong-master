import { useState } from "react";
import loginImage from "../../assets/loginImage.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    console.log("Attempting sign in with email:", email);
    try {
      setError("");
      setLoading(true);

      console.log("Calling signIn function...");
      const { data, error } = await signIn({ email, password });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/home");
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Sign in error details:", error);
      setError("Failed to sign in: " + (error.message || "Please check your credentials"));
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setError("Failed to sign in with Google: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <div className="relative w-full lg:w-1/2 h-64 lg:h-screen">
        <img src={loginImage} className="absolute inset-0 w-full h-full object-cover" alt="auth-image" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Join Now</h1>
            <p className="text-lg md:text-xl">
              Login for free and find out what everyone <br className="hidden md:inline" />
              else from your batch community is doing!
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-background flex flex-col p-6 md:p-12 lg:p-20 justify-center">
        <h1 className="text-xl text-foreground font-semibold mb-8 text-center">LifeLong Learning @EEE</h1>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-m font-bold">Login</CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome Back! Please enter your details.
            </CardDescription>
            {error && (
              <p className="text-sm bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded-lg">{error}</p>
            )}
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Log In"}
                </Button>
                <Button className="w-full bg-white" variant="outline" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </div>
            </form>

            <div className="flex w-full items-center my-6 mx-11">
              <Separator className="w-1/3" />
              <span className="px-4 text-muted-foreground">or</span>
              <Separator className="w-1/3" />
            </div>

            <Button
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Sign In With Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

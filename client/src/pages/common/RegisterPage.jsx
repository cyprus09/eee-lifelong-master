import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import loginImage from "../../assets/loginImage.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError("");
      setLoading(true);

      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) throw error;

      setSuccess("Registration successful! Please check your email for verification.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setError("Failed to sign up with Google: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <div className="relative w-full lg:w-1/2 h-64 lg:h-screen">
        <img src={loginImage} className="absolute inset-0 w-full h-full object-cover" alt="auth-image" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome!</h1>
            <p className="text-lg md:text-xl">
              Create your account and connect with your
              <br className="hidden md:inline" />
              batch community today!
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-background flex flex-col p-6 md:p-12 lg:p-20 justify-between">
        <h1 className="text-xl text-foreground font-semibold mb-8 mx-auto">LifeLong Learning @EEE</h1>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to join your batch community</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 rounded-lg">
                <AlertDescription className="text-sm font-semibold">{success}</AlertDescription>
              </Alert>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="card w-full overflow-hidden flex my-8 mx-11 items-center">
              <Separator className="w-1/3" />
              <span className="px-4 text-muted-foreground">or</span>
              <Separator className="w-1/3" />
            </div>

            <Button className="w-full bg-white" variant="outline" onClick={handleGoogleSignUp} disabled={loading}>
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
              Sign Up With Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground mt-3">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => navigate("/login")}>
            Log in
          </Button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

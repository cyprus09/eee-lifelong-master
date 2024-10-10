import React from "react";
import loginImage from "../../assets/loginImage.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Login = () => {
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

      <div className="w-full lg:w-1/2 bg-background flex flex-col p-6 md:p-12 lg:p-20 justify-between">
        <h1 className="text-xl text-foreground font-semibold mb-8 mx-auto">LifeLong Learning @EEE</h1>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Welcome Back! Please enter your details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" required />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember Me
                  </label>
                </div>
                <Button variant="ghost" className="p-0 h-auto">
                  Forgot Password?
                </Button>
              </div>

              <div className="space-y-4">
                <Button className="w-full" type="submit">
                  Log In
                </Button>
                <Button className="w-full bg-white" variant="outline">
                  Register
                </Button>
              </div>
            </form>

            <div className="card w-full overflow-hidden flex my-8 mx-11 flex items-center">
              <Separator className="w-1/3" />
              <span className="px-4 text-muted-foreground">or</span>
              <Separator className="w-1/3" />
            </div>

            <Button className="w-full bg-white" variant="outline">
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

        <p className="text-center text-muted-foreground mt-8">
          Don't have an account?{" "}
          <Button variant="link" className="p-0 h-auto font-semibold">
            Sign up for free
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Login;

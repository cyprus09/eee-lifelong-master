import React from "react";
import loginImage from "../assets/loginImage.png";
import googleImage from "../assets/google.svg";

const Login = () => {
  return (
    <div className="w-full h-screen flex items-start">
      <div className="relative w-1/2 h-full flex flex-col">
        {/* <div className="absolute top-[15%] left-[10%] flex flex-col">
          <h1 className="text-4xl text-[#e18433] font-bold my-4">Join Now</h1>
          <p className="text-xl text-[#e18433] font-normal">
            Login for free and find out what everyone <br></br>else from your batch community is doing!
          </p>
        </div> */}
        <img src={loginImage} className="w-full h-full object-cover" alt="auth-image" />
      </div>

      <div className="w-1/2 h-full bg-[#f5f5f5] flex flex-col p-20 justify-between items-center">
        <h1 className="text-xl text-[#060606] font-semibold">LifeLong Learning @EEE</h1>

        <div className="w-full flex flex-col max-w-[550px]">
          <div className="w-full flex flex-col mb-2">
            <h3 className="text-3xl font-semibold mb-4 mr-auto">Login</h3>
            <p className="text-base mb-2">Welcome Back! Please enter your details.</p>
          </div>

          <div className="w-full flex flex-col">
            <input
              type="email"
              placeholder="Email"
              className="w-full text-black py-4 my-2 pl-2 bg-transparent border-b border-black outline-none focus:outline-none required"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full text-black py-4 my-2 pl-2 bg-transparent border-b border-black outline-none focus:outline-none required"
            />
          </div>

          <div className="w-full flex items-center justify-between">
            <div className="w-full flex items-center">
              <input type="checkbox" className="w-4 h-4 mr-2 my-2" />
              <p className="text-sm">Remember Me</p>
            </div>

            <p className="text-sm font-medium whitespace-nowrap cursor-pointer underline underline-offset-2">
              Forgot Password ?
            </p>
          </div>

          <div className="w-full flex flex-col my-4">
            <button className="w-full bg-[#060606] rounded-md my-2 p-4 text-center flex items-center justify-center text-white font-semibold cursor-pointer">
              Log In
            </button>
            <button className="w-full bg-[#fffff] rounded-md my-2 p-4 text-center flex items-center justify-center text-black border border-black/40 font-semibold cursor-pointer">
              Register
            </button>
          </div>

          <div className="w-full flex items-center justify-center relative py-1">
            <div className="w-full h-[1px] bg-black"></div>
            <p className=" text-lg absolute text-black/80 bg-[#f5f5f5] pl-2 pr-2">or</p>
          </div>

          <div className="w-full bg-[#060606] rounded-md my-3 p-4 text-center flex items-center justify-center text-white font-semibold cursor-pointer">
            <img src={googleImage} alt="google" className="h-6 mr-3" />
            Sign In With Google
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          <p className="text-m font-normal text-[#060606]">
            Don't have an account?{" "}
            <span className="font-semibold underline underline-offset-2 cursor-pointer"> Sign up for free. </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

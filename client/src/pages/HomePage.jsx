import React from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CarouselSlides from "@/components/common/CarouselSlides";

const HomePage = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <CarouselSlides />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;

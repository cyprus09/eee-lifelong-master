import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const CarouselSlides = () => {
  const carouselRef = useRef(null);
  const totalSlides = 5;

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollBy({ left: carouselRef.current.offsetWidth, behavior: "smooth" });

        if (carouselRef.current.scrollLeft >= (totalSlides - 1) * carouselRef.current.offsetWidth) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <Carousel ref={carouselRef} className="mx-20 my-10">
        <CarouselContent>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="h-96">
                  <CardContent className="flex h-full items-center justify-center p-4">
                    <span className="text-2xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default CarouselSlides;

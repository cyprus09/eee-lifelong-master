import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import loginImage from "../../assets/loginImage.png";
import eventsImage from "../../assets/carousel/events.png"
import careerOpportunities from "../../assets/carousel/careerOpportunities.png"
import knowledgeSharing from "../../assets/carousel/knowledgeSharing.png"

const CarouselSlides = () => {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Sample carousel data - replace with your actual content
  const slides = [
    {
      title: "Welcome to EEE Community",
      description: "Connect with your batch mates and alumni",
      image: loginImage,
    },
    {
      title: "Upcoming Events",
      description: "Stay updated with latest community events",
      image: eventsImage,
    },
    {
      title: "Career Opportunities",
      description: "Explore job opportunities from alumni network",
      image: careerOpportunities,
    },
    {
      title: "Knowledge Sharing",
      description: "Learn from industry experts in your field",
      image: knowledgeSharing,
    },
    // {
    //   title: "Community Projects",
    //   description: "Collaborate on innovative engineering projects",
    //   image: "/api/placeholder/1200/600",
    // },
  ];

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const plugin = useMemo(
    () =>
      Autoplay({
        delay: 2000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    []
  );

  return (
    <div className="w-full relative">
      <Carousel
        setApi={setApi}
        plugins={[plugin]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <Card className="border-none shadow-none">
                <CardContent className="relative aspect-[16/9] flex flex-col items-center justify-center p-0 overflow-hidden rounded-xl">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-6">
                    <h2 className="text-3xl font-bold mb-4 text-center">
                      {slide.title}
                    </h2>
                    <p className="text-xl text-center">{slide.description}</p>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      {/* Carousel Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {Array.from({ length: count }).map((_, index) => (
          <Button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "bg-white w-4"
                : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => api?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselSlides;
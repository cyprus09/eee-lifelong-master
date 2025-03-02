import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NotFoundPage = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button className="bg-primary hover:bg-primary/80 px-6 py-2 rounded-lg">Go Back Home</Button>
      </Link>
    </motion.div>
  );
};

export default NotFoundPage;

import { Heart, Shield, Plus, Activity } from "lucide-react";
import { motion } from "framer-motion";

const icons = [
  { Icon: Heart, x: "10%", y: "20%", delay: 0, size: 28 },
  { Icon: Shield, x: "80%", y: "15%", delay: 1, size: 24 },
  { Icon: Plus, x: "70%", y: "70%", delay: 2, size: 22 },
  { Icon: Activity, x: "15%", y: "75%", delay: 0.5, size: 26 },
  { Icon: Heart, x: "85%", y: "50%", delay: 1.5, size: 20 },
  { Icon: Plus, x: "25%", y: "45%", delay: 2.5, size: 18 },
];

const FloatingIcons = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/20"
          style={{ left: x, top: y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 6,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingIcons;

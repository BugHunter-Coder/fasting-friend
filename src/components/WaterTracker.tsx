import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WaterTracker() {
  const [glasses, setGlasses] = useState(0);
  const goal = 8;

  // Load from local storage for now since no DB table exists yet
  useEffect(() => {
    const saved = localStorage.getItem("water_today");
    const lastDate = localStorage.getItem("water_date");
    const today = new Date().toDateString();

    if (lastDate === today && saved) {
      setGlasses(parseInt(saved));
    } else {
      setGlasses(0);
      localStorage.setItem("water_date", today);
    }
  }, []);

  const updateWater = (delta: number) => {
    const newValue = Math.max(0, glasses + delta);
    setGlasses(newValue);
    localStorage.setItem("water_today", newValue.toString());
  };

  const progress = Math.min(1, glasses / goal);

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-blue-50/50 to-transparent overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Water Intake</h3>
              <p className="text-xs text-muted-foreground">{glasses} of {goal} glasses</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => updateWater(-1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
              onClick={() => updateWater(1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto py-2">
          {Array.from({ length: goal }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                scale: i < glasses ? [1, 1.2, 1] : 1,
                opacity: i < glasses ? 1 : 0.3
              }}
              className={`flex-shrink-0 h-6 w-6 rounded-sm ${i < glasses ? 'text-blue-600' : 'text-blue-300'}`}
            >
              <Droplets className="h-full w-full fill-current" />
            </motion.div>
          ))}
          {glasses > goal && (
            <span className="text-blue-600 font-bold text-xs flex items-center">+{glasses - goal}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

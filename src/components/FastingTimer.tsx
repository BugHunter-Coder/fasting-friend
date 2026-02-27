import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { ImpactStyle } from "@capacitor/haptics";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Clock, Edit2 } from "lucide-react";

const SCHEDULES = [
  { label: "16:8", fastHours: 16 },
  { label: "18:6", fastHours: 18 },
  { label: "20:4 (OMAD)", fastHours: 20 },
  { label: "Custom", fastHours: 0 },
];

const FASTING_STAGES = [
  { hours: 0, label: "Blood Sugar Rising", description: "Your body is processing your last meal." },
  { hours: 4, label: "Blood Sugar Falling", description: "Blood sugar levels return to normal." },
  { hours: 8, label: "Fat Burning", description: "Body begins to switch to fat for energy." },
  { hours: 12, label: "Ketosis", description: "Fat burning increases as ketone levels rise." },
  { hours: 18, label: "Autophagy", description: "Body starts recycling damaged cells." },
];

interface ActiveFast {
  id: string;
  started_at: string;
  fasting_hours: number;
  schedule_type: string;
}

export function FastingTimer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { impact, notification } = useHaptics();
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState("16:8");
  const [customHours, setCustomHours] = useState("16");
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(Date.now());
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchActive = async () => {
      try {
        const { data } = await supabase
          .from("fasts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          setActiveFast(data[0] as ActiveFast);
          setNewStartTime(new Date(data[0].started_at).toISOString().slice(0, 16));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchActive();
  }, [user]);

  const fastHours = useMemo(() => {
    if (schedule === "Custom") return Number(customHours) || 16;
    return SCHEDULES.find((s) => s.label === schedule)?.fastHours ?? 16;
  }, [schedule, customHours]);

  const { elapsed, remaining, progress, currentStage } = useMemo(() => {
    if (!activeFast) return { elapsed: 0, remaining: 0, progress: 0, currentStage: FASTING_STAGES[0] };
    const start = new Date(activeFast.started_at).getTime();
    const totalMs = activeFast.fasting_hours * 3600000;
    const elapsedMs = now - start;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    
    const elapsedHours = elapsedMs / 3600000;
    const stage = [...FASTING_STAGES].reverse().find(s => elapsedHours >= s.hours) || FASTING_STAGES[0];

    return {
      elapsed: elapsedMs,
      remaining: remainingMs,
      progress: Math.min(1, elapsedMs / totalMs),
      currentStage: stage,
    };
  }, [activeFast, now]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startFast = async () => {
    if (!user) return;
    await impact(ImpactStyle.Heavy);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const started_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("fasts")
      .insert({
        user_id: user.id,
        schedule_type: schedule,
        fasting_hours: fastHours,
        status: "active",
        started_at,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setActiveFast(data as ActiveFast);
    setNewStartTime(new Date(started_at).toISOString().slice(0, 16));
    notification('SUCCESS');
    toast({ title: "Fast started! 🔥", description: `${fastHours}-hour fast has begun. You got this!` });
  };

  const updateStartTime = async () => {
    if (!activeFast || !user || !newStartTime) return;
    const { error } = await supabase
      .from("fasts")
      .update({ started_at: new Date(newStartTime).toISOString() })
      .eq("id", activeFast.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setActiveFast({ ...activeFast, started_at: new Date(newStartTime).toISOString() });
    setIsEditingTime(false);
    toast({ title: "Time updated", description: "Fasting start time has been updated." });
  };

  const endFast = async () => {
    if (!activeFast || !user) return;
    await impact(ImpactStyle.Medium);
    const { error } = await supabase
      .from("fasts")
      .update({ status: "completed", ended_at: new Date().toISOString(), notes })
      .eq("id", activeFast.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setActiveFast(null);
    setNotes("");
    goalNotifiedRef.current = null;
    notification('SUCCESS');
    toast({ title: "Fast complete! 🎉", description: "Great job staying consistent!" });
  };

  // Browser notification when fast goal is reached
  const goalNotifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeFast || remaining > 0) return;
    if (goalNotifiedRef.current === activeFast.id) return;
    goalNotifiedRef.current = activeFast.id;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("FastFlow – Fast complete! 🎉", {
        body: `You've completed your ${activeFast.schedule_type} fast. Great job!`,
        icon: "/favicon.ico",
      });
    }
  }, [remaining, activeFast]);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <Skeleton className="h-[220px] w-[220px] rounded-full" />
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 min-h-[450px]">
      {/* Circular progress */}
      <div className="relative flex items-center justify-center h-[220px]">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
          <motion.circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <AnimatePresence mode="wait">
            {activeFast ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {remaining > 0 ? "Remaining" : "Overtime! 💪"}
                </span>
                <span className="font-display text-3xl font-bold text-foreground">{formatTime(remaining)}</span>
                <span className="text-xs font-semibold text-primary">{Math.round(progress * 100)}%</span>
                <span className="text-[10px] text-muted-foreground mt-1">{activeFast.schedule_type} fast</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <Clock className="mb-1 h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ready to fast?</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fasting Stage Info - Reserved space to prevent jump */}
      <div className="w-full max-w-xs min-h-[84px]">
        <AnimatePresence mode="wait">
          {activeFast && (
            <motion.div 
              key={currentStage.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-xl bg-muted/50 p-4 text-center border border-primary/10"
            >
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">{currentStage.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{currentStage.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs min-h-[120px]">
        <AnimatePresence mode="wait">
          {!activeFast ? (
            <motion.div 
              key="start-controls"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-3"
            >
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULES.map((s) => (
                    <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {schedule === "Custom" && (
                <Input type="number" placeholder="Fasting hours" value={customHours} onChange={(e) => setCustomHours(e.target.value)} min={1} max={72} />
              )}
              <Button onClick={startFast} size="lg" className="gap-2">
                <Play className="h-4 w-4" /> Start Fast
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="active-controls"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3"
            >
              <div className="flex gap-2">
                <Textarea placeholder="How are you feeling? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="flex-1" />
                <Dialog open={isEditingTime} onOpenChange={setIsEditingTime}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-auto aspect-square">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Start Time</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startTime">Start Date & Time</Label>
                        <Input id="startTime" type="datetime-local" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={updateStartTime}>Save changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Button onClick={endFast} variant="destructive" size="lg" className="gap-2">
                <Square className="h-4 w-4" /> End Fast
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

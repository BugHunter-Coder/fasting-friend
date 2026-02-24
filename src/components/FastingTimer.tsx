import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Clock } from "lucide-react";

const SCHEDULES = [
  { label: "16:8", fastHours: 16 },
  { label: "18:6", fastHours: 18 },
  { label: "20:4 (OMAD)", fastHours: 20 },
  { label: "Custom", fastHours: 0 },
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
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [schedule, setSchedule] = useState("16:8");
  const [customHours, setCustomHours] = useState("16");
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchActive = async () => {
      const { data } = await supabase
        .from("fasts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setActiveFast(data[0] as ActiveFast);
      }
    };
    fetchActive();
  }, [user]);

  const fastHours = useMemo(() => {
    if (schedule === "Custom") return Number(customHours) || 16;
    return SCHEDULES.find((s) => s.label === schedule)?.fastHours ?? 16;
  }, [schedule, customHours]);

  const { elapsed, remaining, progress } = useMemo(() => {
    if (!activeFast) return { elapsed: 0, remaining: 0, progress: 0 };
    const start = new Date(activeFast.started_at).getTime();
    const totalMs = activeFast.fasting_hours * 3600000;
    const elapsedMs = now - start;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    return {
      elapsed: elapsedMs,
      remaining: remainingMs,
      progress: Math.min(1, elapsedMs / totalMs),
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
    const { data, error } = await supabase
      .from("fasts")
      .insert({
        user_id: user.id,
        schedule_type: schedule,
        fasting_hours: fastHours,
        status: "active",
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setActiveFast(data as ActiveFast);
    toast({ title: "Fast started! 🔥", description: `${fastHours}-hour fast has begun. You got this!` });
  };

  const endFast = async () => {
    if (!activeFast || !user) return;
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
    toast({ title: "Fast complete! 🎉", description: "Great job staying consistent!" });
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular progress */}
      <div className="relative flex items-center justify-center">
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
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          {activeFast ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">
                {remaining > 0 ? "Remaining" : "Overtime! 💪"}
              </span>
              <span className="font-display text-3xl font-bold text-foreground">{formatTime(remaining)}</span>
              <span className="text-xs text-muted-foreground">{activeFast.schedule_type} fast</span>
            </>
          ) : (
            <>
              <Clock className="mb-1 h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ready to fast?</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      {!activeFast ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
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
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Textarea placeholder="How are you feeling? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <Button onClick={endFast} variant="destructive" size="lg" className="gap-2">
            <Square className="h-4 w-4" /> End Fast
          </Button>
        </div>
      )}
    </div>
  );
}

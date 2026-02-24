import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { FastingTimer } from "@/components/FastingTimer";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyQuote } from "@/lib/motivational-quotes";
import { motion } from "framer-motion";
import { Flame, Zap, CalendarCheck } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ streak: 0, totalFasts: 0, weekHours: 0 });
  const quote = getDailyQuote();

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: fasts } = await supabase
        .from("fasts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("ended_at", { ascending: false });

      if (!fasts) return;

      const totalFasts = fasts.length;

      // Week hours
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekHours = fasts
        .filter((f) => f.ended_at && new Date(f.ended_at) > weekAgo)
        .reduce((sum, f) => {
          const start = new Date(f.started_at).getTime();
          const end = new Date(f.ended_at!).getTime();
          return sum + (end - start) / 3600000;
        }, 0);

      // Streak (consecutive days with a completed fast)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let d = 0; d < 365; d++) {
        const day = new Date(today);
        day.setDate(day.getDate() - d);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const hasFast = fasts.some((f) => {
          const ended = new Date(f.ended_at!);
          return ended >= day && ended < dayEnd;
        });
        if (hasFast) streak++;
        else break;
      }

      setStats({ streak, totalFasts, weekHours: Math.round(weekHours * 10) / 10 });
    };
    fetchStats();
  }, [user]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6 md:ml-56">
        {/* Motivational quote */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-none bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="py-4 text-center">
              <p className="font-display text-sm italic text-foreground">"{quote.text}"</p>
              <p className="mt-1 text-xs text-muted-foreground">— {quote.author}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timer */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-lg">
            <CardContent className="py-8">
              <FastingTimer />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-3">
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <Flame className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <CalendarCheck className="mx-auto mb-1 h-5 w-5 text-warm-sage" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.totalFasts}</p>
              <p className="text-xs text-muted-foreground">Total Fasts</p>
            </CardContent>
          </Card>
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <Zap className="mx-auto mb-1 h-5 w-5 text-accent" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.weekHours}h</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Index;

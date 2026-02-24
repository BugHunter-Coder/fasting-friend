import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Flame, Clock, TrendingUp } from "lucide-react";

const BADGES = [
  { threshold: 1, label: "First Fast!", emoji: "🌱" },
  { threshold: 7, label: "7-Day Streak", emoji: "🔥" },
  { threshold: 10, label: "10 Fasts", emoji: "💪" },
  { threshold: 25, label: "25 Fasts", emoji: "⭐" },
  { threshold: 50, label: "50 Fasts", emoji: "🏆" },
  { threshold: 100, label: "Century Club", emoji: "👑" },
];

const InsightsPage = () => {
  const { user } = useAuth();
  const [totalFasts, setTotalFasts] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [longestFast, setLongestFast] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: fasts } = await supabase
        .from("fasts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (!fasts) return;

      setTotalFasts(fasts.length);

      let maxH = 0;
      let sumH = 0;
      fasts.forEach((f) => {
        if (!f.ended_at) return;
        const h = (new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) / 3600000;
        sumH += h;
        if (h > maxH) maxH = h;
      });
      setTotalHours(Math.round(sumH));
      setLongestFast(Math.round(maxH * 10) / 10);

      // Weekly chart (last 7 days)
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setDate(dEnd.getDate() + 1);
        const dayHours = fasts
          .filter((f) => f.ended_at && new Date(f.ended_at) >= d && new Date(f.ended_at) < dEnd)
          .reduce((sum, f) => sum + (new Date(f.ended_at!).getTime() - new Date(f.started_at).getTime()) / 3600000, 0);
        days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), hours: Math.round(dayHours * 10) / 10 });
      }
      setWeeklyData(days);
    };
    fetch();
  }, [user]);

  const earnedBadges = BADGES.filter((b) => totalFasts >= b.threshold);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Health Insights 📊</h1>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <Flame className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="font-display text-xl font-bold">{totalFasts}</p>
              <p className="text-xs text-muted-foreground">Fasts</p>
            </CardContent>
          </Card>
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <Clock className="mx-auto mb-1 h-5 w-5 text-warm-sunset" />
              <p className="font-display text-xl font-bold">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <TrendingUp className="mx-auto mb-1 h-5 w-5 text-warm-sage" />
              <p className="font-display text-xl font-bold">{longestFast}h</p>
              <p className="text-xs text-muted-foreground">Longest</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly chart */}
        {weeklyData.length > 0 && (
          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(24, 80%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        <Card className="border-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" /> Badges & Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map((badge) => {
                const earned = totalFasts >= badge.threshold;
                return (
                  <motion.div
                    key={badge.label}
                    className={`flex flex-col items-center rounded-xl p-3 text-center ${earned ? "bg-primary/10" : "bg-muted/50 opacity-40"}`}
                    animate={earned ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="mt-1 text-xs font-medium">{badge.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default InsightsPage;

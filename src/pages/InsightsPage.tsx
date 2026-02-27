import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, Flame, Clock, TrendingUp } from "lucide-react";

const BADGES = [
  { threshold: 1, label: "First Fast!", emoji: "🌱" },
  { threshold: 7, label: "7-Day Streak", emoji: "🔥" },
  { threshold: 10, label: "10 Fasts", emoji: "💪" },
  { threshold: 25, label: "25 Fasts", emoji: "⭐" },
  { threshold: 50, label: "50 Fasts", emoji: "🏆" },
  { threshold: 100, label: "Century Club", emoji: "👑" },
];

type Range = "7" | "30";

const InsightsPage = () => {
  const { user } = useAuth();
  const [totalFasts, setTotalFasts] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [longestFast, setLongestFast] = useState(0);
  const [avgHours, setAvgHours] = useState(0);
  const [range, setRange] = useState<Range>("7");
  const [chartData7, setChartData7] = useState<{ day: string; hours: number }[]>([]);
  const [chartData30, setChartData30] = useState<{ day: string; hours: number }[]>([]);

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
      setAvgHours(fasts.length > 0 ? Math.round((sumH / fasts.length) * 10) / 10 : 0);

      // Build chart data for N days back
      const buildChart = (days: number, abbrev: boolean) => {
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const dEnd = new Date(d);
          dEnd.setDate(dEnd.getDate() + 1);
          const dayHours = fasts
            .filter((f) => f.ended_at && new Date(f.ended_at) >= d && new Date(f.ended_at) < dEnd)
            .reduce((sum, f) => sum + (new Date(f.ended_at!).getTime() - new Date(f.started_at).getTime()) / 3600000, 0);
          result.push({
            day: abbrev
              ? d.toLocaleDateString("en", { weekday: "short" })
              : d.toLocaleDateString("en", { month: "short", day: "numeric" }),
            hours: Math.round(dayHours * 10) / 10,
          });
        }
        return result;
      };

      setChartData7(buildChart(7, true));
      setChartData30(buildChart(30, false));
    };
    fetch();
  }, [user]);

  const earnedBadges = BADGES.filter((b) => totalFasts >= b.threshold);
  const chartData = range === "7" ? chartData7 : chartData30;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Health Insights 📊</h1>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <Card className="border-none text-center">
            <CardContent className="py-4">
              <TrendingUp className="mx-auto mb-1 h-5 w-5 text-accent" />
              <p className="font-display text-xl font-bold">{avgHours}h</p>
              <p className="text-xs text-muted-foreground">Avg Fast</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart with range toggle */}
        <Card className="border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Fasting Hours</CardTitle>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["7", "30"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: range === "30" ? 9 : 11 }}
                  interval={range === "30" ? 4 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip formatter={(v: number) => [`${v}h`, "Hours"]} />
                <Bar dataKey="hours" radius={[5, 5, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.hours > 0 ? "hsl(24, 80%, 55%)" : "hsl(24, 80%, 85%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="border-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" /> Badges & Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalFasts === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Complete your first fast to earn badges!</p>
            )}
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
                    {!earned && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">{badge.threshold} fasts</span>
                    )}
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Plus, Target } from "lucide-react";

interface WeightEntry {
  id: string;
  weight: number;
  recorded_at: string;
}

const WeightPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState<number | null>(null);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true });
    if (data) setEntries(data as WeightEntry[]);

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_weight")
      .eq("user_id", user.id)
      .single();
    if (profile?.target_weight) setGoalWeight(Number(profile.target_weight));
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const addWeight = async () => {
    if (!user || !weight) return;
    const { error } = await supabase.from("weight_entries").insert({
      user_id: user.id,
      weight: Number(weight),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setWeight("");
    toast({ title: "Weight logged! ⚖️" });
    fetchEntries();
  };

  const chartData = entries.map((e) => ({
    date: format(new Date(e.recorded_at), "MMM d"),
    weight: e.weight,
  }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Weight Tracker ⚖️</h1>

        {/* Add weight */}
        <Card className="border-none">
          <CardContent className="flex gap-2 py-4">
            <Input type="number" placeholder="Weight (lbs/kg)" value={weight} onChange={(e) => setWeight(e.target.value)} className="flex-1" />
            <Button onClick={addWeight} className="gap-1"><Plus className="h-4 w-4" /> Log</Button>
          </CardContent>
        </Card>

        {/* Goal */}
        {goalWeight && (
          <Card className="border-none bg-gradient-to-r from-warm-sage/10 to-accent/10">
            <CardContent className="flex items-center gap-3 py-4">
              <Target className="h-5 w-5 text-warm-sage" />
              <div>
                <p className="text-sm font-semibold">Goal: {goalWeight} lbs</p>
                {entries.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.abs(entries[entries.length - 1].weight - goalWeight).toFixed(1)} to go!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weight Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="hsl(24, 80%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                  {goalWeight && (
                    <Line type="monotone" dataKey={() => goalWeight} stroke="hsl(140, 20%, 60%)" strokeDasharray="5 5" dot={false} name="Goal" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {entries.slice().reverse().slice(0, 10).map((e) => (
          <Card key={e.id} className="border-none">
            <CardContent className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">{format(new Date(e.recorded_at), "MMM d, yyyy")}</span>
              <span className="font-semibold">{e.weight}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default WeightPage;

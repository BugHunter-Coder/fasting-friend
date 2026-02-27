import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { Plus, Target, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface WeightEntry {
  id: string;
  weight: number;
  recorded_at: string;
  notes: string | null;
}

const WeightPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
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
      notes: weightNotes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setWeight("");
    setWeightNotes("");
    toast({ title: "Weight logged! ⚖️" });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("weight_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Entry deleted" });
  };

  const chartData = entries.map((e) => ({
    date: format(new Date(e.recorded_at), "MMM d"),
    weight: e.weight,
  }));

  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const firstWeight = entries.length > 0 ? entries[0].weight : null;
  const totalChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Weight Tracker ⚖️</h1>

        {/* Add weight */}
        <Card className="border-none">
          <CardContent className="space-y-2 py-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Weight (lbs/kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWeight()}
                className="flex-1"
              />
              <Button onClick={addWeight} className="gap-1"><Plus className="h-4 w-4" /> Log</Button>
            </div>
            <Textarea
              placeholder="Notes (optional) — e.g. post-workout, morning"
              value={weightNotes}
              onChange={(e) => setWeightNotes(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Goal + change summary */}
        {(goalWeight || totalChange !== null) && (
          <div className="grid grid-cols-2 gap-3">
            {goalWeight && (
              <Card className="border-none bg-gradient-to-r from-warm-sage/10 to-accent/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <Target className="h-5 w-5 text-warm-sage shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Goal: {goalWeight}</p>
                    {latestWeight && (
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(latestWeight - goalWeight).toFixed(1)} to go
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {totalChange !== null && entries.length > 1 && (
              <Card className="border-none">
                <CardContent className="flex items-center gap-3 py-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)} overall
                    </p>
                    <p className="text-xs text-muted-foreground">since first entry</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
                    <ReferenceLine y={goalWeight} stroke="hsl(140, 20%, 60%)" strokeDasharray="5 5" label={{ value: "Goal", fontSize: 10, fill: "hsl(140, 20%, 60%)" }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History with delete */}
        {entries.length > 0 && (
          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {entries.slice().reverse().slice(0, 15).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                  <div>
                    <span className="text-sm text-muted-foreground">{format(new Date(e.recorded_at), "MMM d, yyyy")}</span>
                    {e.notes && <p className="text-xs italic text-muted-foreground">{e.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{e.weight}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove the weight entry of {e.weight} from {format(new Date(e.recorded_at), "MMM d, yyyy")}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEntry(e.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default WeightPage;

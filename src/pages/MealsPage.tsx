import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { Plus, Utensils, Trash2, Flame } from "lucide-react";

interface Meal {
  id: string;
  meal_name: string;
  calories: number | null;
  notes: string | null;
  eaten_at: string;
}

const DAILY_CALORIE_GOAL = 2000;

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

const MealsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchMeals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("eaten_at", { ascending: false })
      .limit(100);
    if (data) setMeals(data as Meal[]);
  };

  useEffect(() => { fetchMeals(); }, [user]);

  const addMeal = async () => {
    if (!user || !mealName) return;
    const { error } = await supabase.from("meal_logs").insert({
      user_id: user.id,
      meal_name: mealName,
      calories: calories ? Number(calories) : null,
      notes: notes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setMealName("");
    setCalories("");
    setNotes("");
    setShowForm(false);
    toast({ title: "Meal logged! 🍽️" });
    fetchMeals();
  };

  const deleteMeal = async (id: string, name: string) => {
    const { error } = await supabase.from("meal_logs").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast({ title: `"${name}" removed` });
  };

  // Group meals by calendar day
  const groupedMeals = useMemo(() => {
    const groups: Record<string, Meal[]> = {};
    for (const meal of meals) {
      const day = format(new Date(meal.eaten_at), "yyyy-MM-dd");
      if (!groups[day]) groups[day] = [];
      groups[day].push(meal);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [meals]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meal Log 🍽️</h1>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Meal
          </Button>
        </div>

        {showForm && (
          <Card className="border-none">
            <CardContent className="space-y-3 py-4">
              <Input placeholder="What did you eat?" value={mealName} onChange={(e) => setMealName(e.target.value)} />
              <Input type="number" placeholder="Calories (optional)" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button onClick={addMeal} className="flex-1">Save Meal</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {groupedMeals.length === 0 && !showForm && (
          <Card className="border-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              No meals logged yet. Tap "Add Meal" to start!
            </CardContent>
          </Card>
        )}

        {groupedMeals.map(([day, dayMeals]) => {
          const totalCals = dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
          const hasCals = dayMeals.some((m) => m.calories !== null);
          const progress = Math.min(1, totalCals / DAILY_CALORIE_GOAL);

          return (
            <div key={day} className="space-y-2">
              {/* Day header with calorie summary */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground">{formatDayLabel(day)}</span>
                {hasCals && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className={totalCals >= DAILY_CALORIE_GOAL ? "text-orange-500 font-semibold" : ""}>
                      {totalCals} / {DAILY_CALORIE_GOAL} cal
                    </span>
                  </div>
                )}
              </div>

              {/* Calorie progress bar */}
              {hasCals && (
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${totalCals >= DAILY_CALORIE_GOAL ? "bg-orange-500" : "bg-primary"}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}

              {/* Meals for this day */}
              <Card className="border-none">
                <CardContent className="divide-y divide-border/50 p-0">
                  {dayMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                        <Utensils className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{meal.meal_name}</span>
                          {meal.calories && (
                            <span className="text-xs text-muted-foreground shrink-0">{meal.calories} cal</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(meal.eaten_at), "h:mm a")}</p>
                        {meal.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">{meal.notes}</p>}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove "{meal.meal_name}" from your log? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMeal(meal.id, meal.meal_name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default MealsPage;

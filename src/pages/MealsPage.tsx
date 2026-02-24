import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Utensils } from "lucide-react";

interface Meal {
  id: string;
  meal_name: string;
  calories: number | null;
  notes: string | null;
  eaten_at: string;
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
      .limit(50);
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
              <Button onClick={addMeal} className="w-full">Save Meal</Button>
            </CardContent>
          </Card>
        )}

        {meals.length === 0 && !showForm && (
          <Card className="border-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              No meals logged yet. Tap "Add Meal" to start!
            </CardContent>
          </Card>
        )}

        {meals.map((meal) => (
          <Card key={meal.id} className="border-none">
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
                <Utensils className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{meal.meal_name}</span>
                  {meal.calories && <span className="text-xs text-muted-foreground">{meal.calories} cal</span>}
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(meal.eaten_at), "MMM d · h:mm a")}</p>
                {meal.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">{meal.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default MealsPage;

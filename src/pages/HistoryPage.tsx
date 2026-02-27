import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Calendar, Trash2 } from "lucide-react";

interface Fast {
  id: string;
  schedule_type: string;
  fasting_hours: number;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
}

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fasts, setFasts] = useState<Fast[]>([]);

  const fetchFasts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("fasts")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50);
    if (data) setFasts(data as Fast[]);
  };

  useEffect(() => { fetchFasts(); }, [user]);

  const deleteFast = async (id: string) => {
    const { error } = await supabase.from("fasts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setFasts((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Fast deleted" });
  };

  const getDuration = (f: Fast) => {
    if (!f.ended_at) return "In progress...";
    const ms = new Date(f.ended_at).getTime() - new Date(f.started_at).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Fasting History 📖</h1>
        {fasts.length === 0 && (
          <Card className="border-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              No fasts yet. Start your first fast from the dashboard!
            </CardContent>
          </Card>
        )}
        {fasts.map((fast) => (
          <Card key={fast.id} className="border-none">
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fast.status === "completed" ? "bg-warm-sage/20 text-warm-sage" : "bg-primary/20 text-primary"}`}>
                {fast.status === "completed" ? <Calendar className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{fast.schedule_type}</span>
                  <span className="text-sm text-muted-foreground">{getDuration(fast)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(fast.started_at), "MMM d, yyyy · h:mm a")}
                </p>
                {fast.notes && <p className="mt-1 text-xs text-muted-foreground italic">{fast.notes}</p>}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this fast?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the {fast.schedule_type} fast from {format(new Date(fast.started_at), "MMM d, yyyy")}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteFast(fast.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default HistoryPage;

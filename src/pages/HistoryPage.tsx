import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Clock, Calendar } from "lucide-react";

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
  const [fasts, setFasts] = useState<Fast[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("fasts")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);
      if (data) setFasts(data as Fast[]);
    };
    fetch();
  }, [user]);

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
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${fast.status === "completed" ? "bg-warm-sage/20 text-warm-sage" : "bg-primary/20 text-primary"}`}>
                {fast.status === "completed" ? <Calendar className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{fast.schedule_type}</span>
                  <span className="text-sm text-muted-foreground">{getDuration(fast)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(fast.started_at), "MMM d, yyyy · h:mm a")}
                </p>
                {fast.notes && <p className="mt-1 text-xs text-muted-foreground italic">{fast.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default HistoryPage;

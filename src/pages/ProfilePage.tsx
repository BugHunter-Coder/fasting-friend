import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("16:8");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setDisplayName(data.display_name || "");
        setTargetWeight(data.target_weight?.toString() || "");
        setPreferredSchedule(data.preferred_schedule || "16:8");
      }
    };
    fetch();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        target_weight: targetWeight ? Number(targetWeight) : null,
        preferred_schedule: preferredSchedule,
      })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated! ✨" });
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 md:ml-56">
        <h1 className="text-2xl font-bold">Profile 👤</h1>
        <Card className="border-none">
          <CardContent className="space-y-4 py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">{user?.email}</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Target Weight</label>
                <Input type="number" placeholder="lbs or kg" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Preferred Schedule</label>
                <Select value={preferredSchedule} onValueChange={setPreferredSchedule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:8">16:8</SelectItem>
                    <SelectItem value="18:6">18:6</SelectItem>
                    <SelectItem value="20:4">20:4 (OMAD)</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={save} className="w-full" disabled={loading}>{loading ? "Saving..." : "Save Profile"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

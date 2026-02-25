import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Smartphone, Globe, Apple, Activity, RefreshCcw, CheckCircle2, AlertCircle, Footprints, Zap, Heart } from "lucide-react";
import { useHealthKit } from "@/hooks/useHealthKit";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected: appleLinked, connect: connectApple, disconnect: disconnectApple, lastSyncAt, syncData: syncApple, isAvailable: isAppleAvailable } = useHealthKit();
  const { isConnected: googleLinked, connect: connectGoogle, disconnect: disconnectGoogle, isSyncing: isGoogleSyncing, syncData: syncGoogle } = useGoogleFit();
  
  const [displayName, setDisplayName] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("16:8");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setDisplayName(data.display_name || "");
        setTargetWeight(data.target_weight?.toString() || "");
        setPreferredSchedule(data.preferred_schedule || "16:8");
        setRole(data.role || "user");
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

  const handleSync = async (type: 'apple' | 'google') => {
    if (type === 'apple') {
      setIsSyncing(true);
      await syncApple();
      setIsSyncing(false);
    } else {
      await syncGoogle();
    }
  };

  const toggleIntegration = async (type: 'apple' | 'google') => {
    if (type === 'apple') {
      if (appleLinked) {
        disconnectApple();
      } else {
        setIsShowApplePermissions(true);
      }
    } else {
      if (googleLinked) {
        disconnectGoogle();
      } else {
        await connectGoogle();
      }
    }
  };

  const [isShowApplePermissions, setIsShowApplePermissions] = useState(false);
  const [permissions, setPermissions] = useState({
    steps: true,
    weight: true,
    energy: true,
    heart: true
  });

  const handleAppleConnect = async () => {
    setIsShowApplePermissions(false);
    const read: string[] = [];
    if (permissions.steps) read.push("stepCount");
    if (permissions.weight) read.push("weight");
    if (permissions.energy) read.push("activeEnergyBurned");
    if (permissions.heart) read.push("heartRate");
    await connectApple({ read });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6 md:ml-56 px-4 pb-12">
        <h1 className="text-2xl font-bold">Profile 👤</h1>
        
        {/* Apple Health Permissions Dialog */}
        <Dialog open={isShowApplePermissions} onOpenChange={setIsShowApplePermissions}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-white rounded-3xl">
            <div className="bg-[#F2F2F7] px-6 py-8 flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                <Apple className="h-10 w-10 text-black" />
              </div>
              <h2 className="text-xl font-bold text-black tracking-tight">Health Access</h2>
              <p className="text-sm text-gray-500 mt-2 px-4 leading-snug">
                "Fasting Friend" would like to access and update your Health data.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Allow "Fasting Friend" to read:</p>
                
                {[
                  { id: 'steps', label: 'Steps', icon: <Footprints className="h-4 w-4 text-rose-500" /> },
                  { id: 'weight', label: 'Weight', icon: <Activity className="h-4 w-4 text-blue-500" /> },
                  { id: 'energy', label: 'Active Energy', icon: <Zap className="h-4 w-4 text-orange-500" /> },
                  { id: 'heart', label: 'Heart Rate', icon: <Heart className="h-4 w-4 text-red-500" /> }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 p-2 rounded-lg">{item.icon}</div>
                      <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                    </div>
                    <Switch 
                      checked={permissions[item.id as keyof typeof permissions]} 
                      onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, [item.id]: checked }))}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  onClick={handleAppleConnect}
                  className="w-full h-12 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-base"
                >
                  Allow Access
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsShowApplePermissions(false)}
                  className="w-full h-10 text-gray-400 font-medium text-sm"
                >
                  Don't Allow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 relative">
              <User className="h-8 w-8 text-primary" />
              {role === 'admin' && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full border-2 border-background">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {role} Account
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Weight</label>
                  <Input type="number" placeholder="lbs or kg" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
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
              </div>
              <Button onClick={save} className="w-full h-11" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Health Integrations
              </div>
              {!isAppleAvailable && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                  <AlertCircle className="h-3 w-3" />
                  Native App Only
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            {/* Apple Health Card */}
            <div className={`flex flex-col gap-4 p-4 rounded-xl border border-muted bg-card transition-colors ${!isAppleAvailable ? 'opacity-60 grayscale' : 'hover:bg-muted/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-black p-2 rounded-lg">
                    <Apple className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Apple Health</h4>
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${appleLinked ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <p className="text-[11px] text-muted-foreground">
                        {appleLinked ? "Connected" : isAppleAvailable ? "Not connected" : "Available on iOS"}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant={appleLinked ? "outline" : "default"} 
                  size="sm" 
                  disabled={!isAppleAvailable}
                  className="h-9 px-4 rounded-full"
                  onClick={() => toggleIntegration('apple')}
                >
                  {appleLinked ? "Disconnect" : "Connect"}
                </Button>
              </div>

              {appleLinked && isAppleAvailable && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-dashed border-muted flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Last synchronized:</span>
                      <span className="font-medium">
                        {lastSyncAt ? format(new Date(lastSyncAt), "MMM d, h:mm a") : "Never"}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSync('apple')} 
                      disabled={isSyncing}
                      className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/5"
                    >
                      <RefreshCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Steps & Distance
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Weight (Body Mass)
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Active Energy
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Heart Rate
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Google Fit Card */}
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-muted bg-card hover:bg-muted/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white border p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Google Fit</h4>
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${googleLinked ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <p className="text-[11px] text-muted-foreground">
                        {googleLinked ? "Connected" : "Import activity from Google Fit"}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant={googleLinked ? "outline" : "default"} 
                  size="sm" 
                  className="h-9 px-4 rounded-full"
                  onClick={() => toggleIntegration('google')}
                >
                  {googleLinked ? "Unlink" : "Link Account"}
                </Button>
              </div>

              {googleLinked && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-dashed border-muted flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Real-time Cloud Sync</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSync('google')} 
                      disabled={isGoogleSyncing}
                      className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/5"
                    >
                      <RefreshCcw className={`h-3 w-3 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-[10px] text-center text-muted-foreground leading-relaxed italic px-4">
              Apple Health requires the native iOS application to function. Google Fit is available on all platforms via cloud sync.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

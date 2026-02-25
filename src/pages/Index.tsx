import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { FastingTimer } from "@/components/FastingTimer";
import { WaterTracker } from "@/components/WaterTracker";
import { useHealthKit } from "@/hooks/useHealthKit";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDailyQuote } from "@/lib/motivational-quotes";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, CalendarCheck, Quote, Star, TrendingUp, Info, Activity, Heart, Footprints, RefreshCcw } from "lucide-react";

const HEALTH_TIPS = [
  { title: "Stay Hydrated", text: "Drinking water while fasting helps control hunger and maintains energy levels." },
  { title: "Electrolytes", text: "A pinch of sea salt in your water can help prevent headaches during longer fasts." },
  { title: "Break Gently", text: "End your fast with easily digestible proteins or healthy fats for better digestion." },
  { title: "Listen to Body", text: "It's okay to end a fast early if you feel dizzy or unwell. Safety first!" }
];

const Index = () => {
  const { user } = useAuth();
  const { isConnected: isHKConnected, data: hkData, syncData: syncHK, isAvailable: isHKAvailable } = useHealthKit();
  const { isConnected: isGFConnected, syncData: syncGF } = useGoogleFit();
  const [stats, setStats] = useState({ streak: 0, totalFasts: 0, weekHours: 0 });
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const quote = getDailyQuote();

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    if (isHKConnected && isHKAvailable) await syncHK();
    if (isGFConnected) await syncGF();
    setIsSyncing(false);
  };

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch health history
      const { data: history } = await supabase
        .from("health_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);
      
      if (history) setHealthHistory(history);

      // Fetch stats
      const { data: fasts } = await supabase
        .from("fasts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("ended_at", { ascending: false });

      if (!fasts) return;

      const totalFasts = fasts.length;

      // Week hours
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekHours = fasts
        .filter((f) => f.ended_at && new Date(f.ended_at) > weekAgo)
        .reduce((sum, f) => {
          const start = new Date(f.started_at).getTime();
          const end = new Date(f.ended_at!).getTime();
          return sum + (end - start) / 3600000;
        }, 0);

      // Streak (consecutive days with a completed fast)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let d = 0; d < 365; d++) {
        const day = new Date(today);
        day.setDate(day.getDate() - d);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const hasFast = fasts.some((f) => {
          const ended = new Date(f.ended_at!);
          return ended >= day && ended < dayEnd;
        });
        if (hasFast) streak++;
        else break;
      }

      setStats({ streak, totalFasts, weekHours: Math.round(weekHours * 10) / 10 });
    };

    fetchData();
  }, [user, isHKConnected, isGFConnected]);

  // Calculate current display data
  const currentHealthData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = healthHistory.find(h => h.date === today);
    
    if (todayData) {
      return {
        steps: todayData.steps || 0,
        energy: todayData.active_energy || 0
      };
    }
    
    // Fallback to hkData if available and today's snapshot hasn't been saved yet
    if (hkData) {
      return {
        steps: hkData.steps,
        energy: hkData.activeEnergy
      };
    }
    
    return null;
  }, [healthHistory, hkData]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-8 md:ml-56 px-4 pb-12">
        {/* Header/Greeting */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between pt-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {profile?.display_name?.split(' ')[0] || 'Fast Friend'}!</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 text-primary fill-primary" />
              Keep up the great progress!
            </p>
          </div>
          <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {profile?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Quick stats cards - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-gradient-to-b from-primary/5 to-transparent rounded-2xl p-4 border border-primary/10 text-center space-y-1">
            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
              <Flame className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.streak}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Streak</p>
          </div>
          
          <div className="bg-gradient-to-b from-warm-sage/5 to-transparent rounded-2xl p-4 border border-warm-sage/10 text-center space-y-1">
            <div className="bg-warm-sage/10 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
              <CalendarCheck className="h-4 w-4 text-warm-sage" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalFasts}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</p>
          </div>

          <div className="bg-gradient-to-b from-accent/5 to-transparent rounded-2xl p-4 border border-accent/10 text-center space-y-1">
            <div className="bg-accent/10 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.weekHours}h</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Week</p>
          </div>
        </motion.div>

        {/* Health Activity Header - Appears only if linked */}
        {(isHKConnected || isGFConnected) && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              Daily Activity
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGlobalSync}
              disabled={isSyncing}
              className="h-7 text-[11px] gap-1.5 text-muted-foreground hover:text-primary"
            >
              <RefreshCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        )}

        {/* Health Activity Card - Appears only if linked */}
        {(isHKConnected || isGFConnected) && currentHealthData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            <Card className="border-none bg-rose-50/30 overflow-hidden relative group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-rose-100 p-2.5 rounded-xl">
                  <Footprints className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-0.5">Steps</p>
                  <p className="text-xl font-black text-foreground">{currentHealthData.steps.toLocaleString()}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <Footprints className="h-16 w-16 text-rose-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-orange-50/30 overflow-hidden relative group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-orange-100 p-2.5 rounded-xl">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-0.5">Energy</p>
                  <p className="text-xl font-black text-foreground">{currentHealthData.energy} kcal</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <Activity className="h-16 w-16 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Timer Card - Enhanced Shadow and Border */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="h-24 w-24 text-primary" />
            </div>
            <CardContent className="py-10 relative z-10">
              <FastingTimer />
            </CardContent>
          </Card>
        </motion.div>

        {/* Water Tracker - New Functionality */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <WaterTracker />
        </motion.div>

        {/* Health Tips Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Card className="border-none bg-accent/5 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-accent/10 p-2 rounded-lg mt-1">
                  <Info className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-h-[60px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tipIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                        {HEALTH_TIPS[tipIndex].title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {HEALTH_TIPS[tipIndex].text}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Motivational quote - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <Card className="border-none bg-background/80 backdrop-blur-sm relative">
              <CardContent className="py-6 px-8 text-center relative">
                <Quote className="h-6 w-6 text-primary/20 absolute top-4 left-4" />
                <p className="font-display text-base leading-relaxed text-foreground italic">
                  "{quote.text}"
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="h-px w-4 bg-muted-foreground/30"></div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{quote.author}</p>
                  <div className="h-px w-4 bg-muted-foreground/30"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Index;

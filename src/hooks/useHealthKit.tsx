import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';
import { Capacitor } from '@capacitor/core';

export interface HealthKitData {
  steps: number;
  weight: number | null;
  heartRate: number | null;
  activeEnergy: number; // Calories burned
}

interface ConnectOptions {
  read?: string[];
}

export function useHealthKit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [data, setData] = useState<HealthKitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Strict Native Check
  useEffect(() => {
    const checkAvailability = async () => {
      const isIOS = Capacitor.getPlatform() === 'ios';
      const isNative = Capacitor.isNativePlatform();
      
      if (isIOS && isNative) {
        try {
          await CapacitorHealthkit.isAvailable();
          setIsAvailable(true);
        } catch (e) {
          console.error("HealthKit not available on this device", e);
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  // Fetch status from Supabase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchHealthStatus = async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("healthkit_connected, healthkit_last_sync, health_data")
        .eq("user_id", user.id)
        .single();

      if (profile && !error) {
        setIsConnected(profile.healthkit_connected || false);
        setLastSyncAt(profile.healthkit_last_sync);
        setData(profile.health_data as unknown as HealthKitData || null);
      }
      setIsLoading(false);
    };

    fetchHealthStatus();
  }, [user]);

  const connect = async (options?: ConnectOptions) => {
    if (!user) return;
    
    if (!isAvailable) {
      toast({
        title: "Native Only",
        description: "Apple Health is only available when running the native iOS app.",
        variant: "destructive"
      });
      return;
    }

    const read = (options?.read?.length ? options.read : ["stepCount", "weight", "activeEnergyBurned", "heartRate"]).filter(Boolean);
    if (read.length === 0) {
      toast({
        title: "No Data Selected",
        description: "Select at least one Health data type to connect.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Real HealthKit Authorization Request
      await CapacitorHealthkit.requestAuthorization({
        all: [],
        read,
        write: []
      });

      const { error } = await supabase
        .from("profiles")
        .update({ 
          healthkit_connected: true,
          healthkit_last_sync: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (!error) {
        setIsConnected(true);
        toast({
          title: "Apple Health Connected! ❤️",
          description: "Real-time sync has been authorized on this device.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Authorization Failed",
        description: err.message || "Could not link with Apple Health.",
        variant: "destructive"
      });
    }
  };

  const disconnect = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        healthkit_connected: false,
        health_data: {} as any
      })
      .eq("user_id", user.id);

    if (!error) {
      setIsConnected(false);
      setData(null);
      setLastSyncAt(null);
      toast({
        title: "HealthKit Disconnected",
        variant: "destructive",
      });
    }
  };

  const syncData = async () => {
    if (!isConnected || !user || !isAvailable) return;

    try {
      // Query Steps for today
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();

      let latestSteps = 0;
      let latestEnergy = 0;
      let latestWeight: number | null = null;

      try {
        const stepsResult = await CapacitorHealthkit.getStatisticsCollection({
          quantityTypeSampleName: "stepCount",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          interval: { unit: "day", value: 1 },
          anchorDate: startDate.toISOString()
        });
        latestSteps = stepsResult.data?.[0]?.value || 0;
      } catch (err) {
        console.warn("HealthKit steps query failed:", err);
      }

      try {
        const energyResult = await CapacitorHealthkit.getStatisticsCollection({
          quantityTypeSampleName: "activeEnergyBurned" as any,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          interval: { unit: "day", value: 1 },
          anchorDate: startDate.toISOString()
        });
        latestEnergy = energyResult.data?.[0]?.value || 0;
      } catch (err) {
        console.warn("HealthKit active energy query failed:", err);
      }

      try {
        const weightResult = await CapacitorHealthkit.getBodyMassEntries({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // last 30 days
          endDate: endDate.toISOString(),
          limit: 1
        });
        latestWeight = weightResult.data?.[0]?.value || null;
      } catch (err) {
        console.warn("HealthKit weight query failed:", err);
      }

      const healthData: HealthKitData = {
        steps: latestSteps,
        weight: latestWeight,
        heartRate: null,
        activeEnergy: latestEnergy
      };

      const now = new Date().toISOString();
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          health_data: healthData as any,
          healthkit_last_sync: now
        })
        .eq("user_id", user.id);

      const { error: snapshotError } = await supabase
        .from("health_snapshots")
        .upsert({ 
          user_id: user.id,
          date: now.split('T')[0],
          steps: healthData.steps,
          active_energy: healthData.activeEnergy,
          weight: healthData.weight,
          heart_rate: healthData.heartRate,
          source: "Apple Health"
        });

      if (!profileError && !snapshotError) {
        setData(healthData);
        setLastSyncAt(now);
        toast({
          title: "Health Data Synced",
          description: "Successfully pulled live data from Apple Health.",
        });
      }
    } catch (err) {
      console.error("HealthKit Sync Error:", err);
      toast({
        title: "Sync Failed",
        description: "Could not fetch data from Apple Health store.",
        variant: "destructive"
      });
    }
  };

  return {
    isAvailable,
    isConnected,
    lastSyncAt,
    data,
    isLoading,
    connect,
    disconnect,
    syncData,
  };
}

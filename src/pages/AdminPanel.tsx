import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Activity, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  activeFasts: number;
  totalSnapshots: number;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  role: string | null;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeFasts: 0, totalSnapshots: 0 });
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const isUserAdmin = data?.role === 'admin';
      setIsAdmin(isUserAdmin);

      if (isUserAdmin) {
        fetchAdminData();
      } else {
        setLoading(false);
      }
    };

    const fetchAdminData = async () => {
      // Fetch stats
      const [usersRes, fastsRes, snapshotsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("fasts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("health_snapshots").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        activeFasts: fastsRes.count || 0,
        totalSnapshots: snapshotsRes.count || 0,
      });

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, role, created_at")
        .order("created_at", { ascending: false });
      
      if (profilesData) setProfiles(profilesData);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  if (isAdmin === false) return <Navigate to="/" />;
  if (loading) return <div className="flex h-screen items-center justify-center">Loading Admin...</div>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8 md:ml-56 px-4 pb-12">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-none shadow-sm bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stats.totalUsers}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-sm bg-orange-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wider">Active Fasts</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stats.activeFasts}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-sm bg-rose-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-rose-600 uppercase tracking-wider">Health Data</CardTitle>
                <Calendar className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stats.totalSnapshots}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Users Table */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-mono text-xs">{profile.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{profile.display_name || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${profile.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {profile.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;

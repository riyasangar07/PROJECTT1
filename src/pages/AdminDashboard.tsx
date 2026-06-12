import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, getDocs, orderBy, query, limit } from '@/lib/firebase';
import { ShieldAlert, Users, FileText, Bot, Activity, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    usersCount: 0,
    scansCount: 0,
    chatsCount: 0,
    reportsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        // Fetch stats (Note: For large collections, use aggregation queries in production, doing client-side size for rapid prototype)
        const usersSnap = await getDocs(collection(db, 'users'));
        const scansSnap = await getDocs(collection(db, 'analysisHistory'));
        const chatsSnap = await getDocs(collection(db, 'chatMessages'));
        const reportsSnap = await getDocs(collection(db, 'savedReports'));

        // Fetch recent scans
        const recentQ = query(collection(db, 'analysisHistory'), orderBy('timestamp', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQ);

        setStats({
          usersCount: usersSnap.size,
          scansCount: scansSnap.size,
          chatsCount: chatsSnap.size,
          reportsCount: reportsSnap.size,
        });

        setRecentScans(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Admin permissions may be required", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, [user]);

  // Security barrier (Simple UI barrier, real security needs Firestore Rules isAdmin check)
  if (user?.email !== 'riyasangar07@gmail.com' && !user?.email?.includes('admin') && !db.isMock()) {
     return (
       <div className="flex flex-col flex-1 items-center justify-center p-8 text-center bg-background min-h-[60vh]">
         <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
         <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
         <p className="text-muted-foreground mt-2 max-w-sm">You do not have administrative privileges to view this area.</p>
       </div>
     );
  }

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" /> System Administration
        </h1>
        <p className="text-muted-foreground">Monitor platform activity, users, and AI usage metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
           <div className="p-4 bg-primary/10 rounded-2xl">
              <Users className="w-6 h-6 text-primary" />
           </div>
           <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-black">{stats.usersCount}</p>
           </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
           <div className="p-4 bg-amber-500/10 rounded-2xl">
              <Activity className="w-6 h-6 text-amber-500" />
           </div>
           <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">API Scans</p>
              <p className="text-3xl font-black">{stats.scansCount}</p>
           </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
           <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <Bot className="w-6 h-6 text-emerald-500" />
           </div>
           <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chat Messages</p>
              <p className="text-3xl font-black">{stats.chatsCount}</p>
           </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
           <div className="p-4 bg-indigo-500/10 rounded-2xl">
              <FileText className="w-6 h-6 text-indigo-500" />
           </div>
           <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saved Reports</p>
              <p className="text-3xl font-black">{stats.reportsCount}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="col-span-2 bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
               <h3 className="text-lg font-bold text-foreground">Recent Global Scans</h3>
            </div>
            <div className="divide-y divide-border">
               {recentScans.map((scan, i) => (
                  <div key={i} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                     <div className="flex-1">
                        <span className="text-xs text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</span>
                        <p className="text-sm font-medium line-clamp-1">"{scan.contentPreview}"</p>
                     </div>
                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${
                          scan.result.verdict?.toLowerCase().includes('true') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                          scan.result.verdict?.toLowerCase().includes('false') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                     }`}>
                          {scan.result.verdict}
                     </div>
                     <div className="text-xs text-muted-foreground font-mono">User: {scan.userId.substring(0,6)}...</div>
                  </div>
               ))}
               {recentScans.length === 0 && (
                 <div className="p-8 text-center text-muted-foreground">No scans found.</div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
               <div className="space-y-3">
                 <Link to="/dashboard" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted font-medium transition-colors border border-transparent hover:border-border">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4"/> System Health</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                 </Link>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted font-medium transition-colors border border-transparent hover:border-border">
                    <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Moderate Users</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted font-medium transition-colors border border-transparent hover:border-border">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4"/> Export Audit Log</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                 </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

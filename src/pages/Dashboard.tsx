import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { db, collection, query, where, getDocs, orderBy, limit } from '@/lib/firebase';
import { AlertTriangle, CheckCircle2, FileText, History, Loader2, PieChart, ShieldCheck, Search, Link as LinkIcon, Newspaper, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'analysisHistory'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const docsArr = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        docsArr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistory(docsArr.slice(0, 5));
        
        // Fetch recent news for dashboard
        const res = await fetch('/api/news?category=All Fields');
        if (res.ok) {
           const text = await res.text();
           try {
             const newsData = JSON.parse(text);
             setNews(newsData.slice(0, 3));
           } catch(e) { }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
     return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const realCount = history.filter(h => h.result.verdict?.toLowerCase().includes('true')).length;
  const fakeCount = history.filter(h => h.result.verdict?.toLowerCase().includes('false')).length;
  const mixedCount = history.length - realCount - fakeCount;
  const totalCount = history.length;

  const chartData = {
    labels: ['Real', 'Fake', 'Mixed/Unknown'],
    datasets: [
      {
        data: [realCount, fakeCount, mixedCount],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // emerald-500
          'rgba(244, 63, 94, 0.8)',  // rose-500
          'rgba(245, 158, 11, 0.8)', // amber-500
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
        legend: { display: false }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2">My Analytics</h1>
            <p className="text-muted-foreground">Overview of your verification activity and trusted history.</p>
          </div>
          <Link to="/detect">
             <Button className="font-bold rounded-xl shadow-md h-12 px-6">
               <ShieldCheck className="w-5 h-5 mr-2" /> Verify New Content
             </Button>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center justify-between col-span-1 md:col-span-2 relative overflow-hidden">
           <div className="z-10">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analysis Breakdown</p>
              <div className="flex gap-4 mt-6">
                 <div><span className="w-3 h-3 inline-block rounded-full bg-emerald-500 mr-2"></span><span className="text-sm font-medium">Real: {realCount}</span></div>
                 <div><span className="w-3 h-3 inline-block rounded-full bg-rose-500 mr-2"></span><span className="text-sm font-medium">Fake: {fakeCount}</span></div>
                 <div><span className="w-3 h-3 inline-block rounded-full bg-amber-500 mr-2"></span><span className="text-sm font-medium">Mixed: {mixedCount}</span></div>
              </div>
           </div>
           <div className="h-32 w-32 relative z-10">
              {totalCount > 0 ? <Doughnut data={chartData} options={chartOptions} /> : <div className="w-full h-full rounded-full border-4 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">No Data</div>}
           </div>
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verified Real</p>
           </div>
           <p className="text-4xl font-black mt-2">{realCount}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                 <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Flagged Fake</p>
           </div>
           <p className="text-4xl font-black mt-2">{fakeCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
           <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <ShieldCheck className="text-primary w-5 h-5" /> Recent Verifications
              </h2>
           </div>
           
           {history.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">
               <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="mb-4">No verification history found. Start scanning content to see your analytics.</p>
               <Link to="/detect">
                 <Button variant="outline"><Search className="w-4 h-4 mr-2"/> Scan Now</Button>
               </Link>
             </div>
           ) : (
             <div className="divide-y divide-border">
               {history.map(item => (
                  <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           {item.type === 'text' ? <FileText className="w-4 h-4 text-muted-foreground" /> : <LinkIcon className="w-4 h-4 text-muted-foreground" />}
                           <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{item.type} Analysis</span>
                           <span className="text-xs text-muted-foreground px-2">•</span>
                           <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-foreground font-medium line-clamp-2 leading-relaxed opacity-90">"{item.contentPreview}"</p>
                     </div>
                     
                     <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0">
                        <div className="w-full md:w-32">
                           <div className="flex justify-between text-xs mb-1 font-medium">
                             <span className="text-muted-foreground">Confidence</span>
                             <span>{item.result.confidenceScore}%</span>
                           </div>
                           <Progress value={item.result.confidenceScore} className="h-1.5" />
                        </div>
                        
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border ${
                          item.result.verdict?.toLowerCase().includes('true') ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                          item.result.verdict?.toLowerCase().includes('false') ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 
                          'text-amber-500 bg-amber-500/10 border-amber-500/20'
                        }`}>
                           {item.result.verdict || 'Mixed'}
                        </div>
                     </div>
                  </div>
               ))}
             </div>
           )}
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                    <Newspaper className="w-5 h-5 text-primary" /> Top Headlines
                  </h3>
                  <Link to="/news" className="text-xs text-primary font-bold hover:underline">View All</Link>
               </div>
               
               <div className="space-y-6">
                 {news.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary/50" />
                      Loading global updates...
                    </div>
                 ) : (
                    news.map((item, idx) => (
                      <div key={idx} className="block group">
                         <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                            <span className="font-bold text-primary">{item.source}</span>
                            <span>•</span>
                            <span>{item.date?.substring(0, 10)}</span>
                         </div>
                         <h4 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                         </h4>
                         <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className={`w-3.5 h-3.5 ${item.credibilityScore > 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <span className="text-xs font-medium text-muted-foreground">{item.credibilityScore}% trusted</span>
                         </div>
                      </div>
                    ))
                 )}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}

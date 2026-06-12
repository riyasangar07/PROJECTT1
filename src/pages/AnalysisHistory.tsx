import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, query, where, getDocs, orderBy, deleteDoc, doc } from '@/lib/firebase';
import { Loader2, History, Search, Download, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function AnalysisHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('All');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'analysisHistory'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this analysis record?")) return;
    try {
      await deleteDoc(doc(db, 'analysisHistory', id));
      setHistory(prev => prev.filter(r => r.id !== id));
      toast.success('Record deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete record');
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.contentPreview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = filterVerdict === 'All' || item.result.verdict.toLowerCase().includes(filterVerdict.toLowerCase());
    return matchesSearch && matchesVerdict;
  });

  if (loading) {
     return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
               <History className="w-8 h-8 text-primary"/> My Analysis History
            </h1>
            <p className="text-muted-foreground ml-11">Review, filter, and export your past detection records.</p>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card border border-border p-4 rounded-2xl shadow-sm">
         <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
               placeholder="Search text, URLs..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 h-12 bg-background border-border shadow-sm text-foreground"
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground ml-2" />
            <select 
               value={filterVerdict}
               onChange={(e) => setFilterVerdict(e.target.value)}
               className="h-12 border border-border bg-background text-foreground rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-auto shadow-sm"
            >
               <option value="All">All Verdicts</option>
               <option value="true">Likely Real</option>
               <option value="false">Likely Fake</option>
               <option value="mixed">Mixed</option>
            </select>
         </div>
      </div>

      {filteredHistory.length === 0 ? (
           <div className="p-16 text-center text-muted-foreground bg-card border border-border rounded-3xl shadow-sm">
             <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="text-lg">No analysis history found.</p>
           </div>
         ) : (
           <div className="space-y-4">
             <AnimatePresence>
             {filteredHistory.map((report, i) => (
                <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   transition={{ delay: i * 0.05 }}
                   key={report.id} 
                   className="p-6 bg-card border border-border rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
                >
                   <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                               report.result.verdict?.toLowerCase().includes('true') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                               report.result.verdict?.toLowerCase().includes('false') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                               'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                           }`}>
                               {report.result.verdict || 'Mixed'}
                           </span>
                           <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground">
                               {report.type}
                           </span>
                           <span className="text-xs text-muted-foreground ml-auto">{new Date(report.timestamp).toLocaleString()}</span>
                       </div>
                       <p className="text-foreground font-medium line-clamp-2 leading-relaxed opacity-90">"{report.contentPreview}"</p>
                   </div>
                   
                   <div className="flex items-center gap-2 pl-4 border-l border-border md:w-32 shrink-0">
                       <div className="flex flex-col text-center w-full">
                          <span className="text-2xl font-black text-foreground">{report.result.confidenceScore || 0}%</span>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Confidence</span>
                       </div>
                   </div>

                   <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleDelete(report.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20 shadow-sm h-10 w-10 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                   </div>
                </motion.div>
             ))}
             </AnimatePresence>
           </div>
      )}
    </div>
  );
}

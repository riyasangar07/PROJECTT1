import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, query, where, getDocs, orderBy, deleteDoc, doc } from '@/lib/firebase';
import { Loader2, FileText, Download, Trash2, ShieldCheck, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function SavedReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [user]);

  async function fetchReports() {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'savedReports'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(docs);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savedReports', id));
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Report removed from dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete report');
    }
  };

  const handleDownload = (report: any) => {
    // In a real app we'd generate a PDF. For this, we just invoke window.print() or download JSON.
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `truthlens-report-${report.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Report data downloaded');
  };

  if (loading) {
     return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-2"><Bookmark className="w-8 h-8 text-primary"/> Saved Reports</h1>
            <p className="text-muted-foreground">Access your permanently bookmarked analysis findings & forensic AI reports.</p>
          </div>
      </div>

      {reports.length === 0 ? (
           <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-3xl mt-12 shadow-sm">
             <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No saved reports found. You can bookmark any analysis result from the detector.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {reports.map((report, i) => (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={report.id} 
                   className="p-6 bg-card border border-border rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-start"
                >
                   <div className="flex w-full items-start justify-between mb-4">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                           report.result.verdict?.toLowerCase().includes('true') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                           report.result.verdict?.toLowerCase().includes('false') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                           'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                       }`}>
                           {report.result.verdict || 'Mixed'}
                       </span>
                       <span className="text-xs text-muted-foreground">{new Date(report.timestamp).toLocaleDateString()}</span>
                   </div>
                   
                   <p className="text-foreground font-medium line-clamp-3 leading-relaxed opacity-90 mb-6 flex-1">"{report.contentPreview}"</p>
                   
                   <div className="flex gap-2 w-full mt-auto pt-4 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(report)} className="flex-1 font-semibold text-xs border-primary/20 hover:bg-primary/5">
                            <Download className="w-4 h-4 mr-2" /> Download Ref
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(report.id)} className="font-semibold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                   </div>
                </motion.div>
             ))}
           </div>
      )}
    </div>
  );
}

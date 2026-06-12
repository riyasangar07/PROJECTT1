import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, Users, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export function TrendingFakeNews() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
     const fetchTrends = async () => {
        setLoading(true);
        try {
           const res = await fetch('/api/trending');
           if (res.ok) {
              const data = await res.json();
              setTrends(data);
           }
        } catch(e) {
           console.error("Failed to fetch trends:", e);
        } finally {
           setLoading(false);
        }
     };
     fetchTrends();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-2">
           <TrendingUp className="w-8 h-8 text-rose-500" /> Trending Misinformation
        </h1>
        <p className="text-muted-foreground">Live tracking of the most viral fake news circulating online right now.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
             {trends.map((trend, i) => (
                <motion.div
                   key={trend.id}
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                   className="bg-card border border-border shadow-sm rounded-3xl p-6 relative overflow-hidden flex flex-col"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px] -z-10" />
                   
                   <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         trend.severity === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                         {trend.severity} Risk
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                         <Users className="w-3.5 h-3.5" /> {trend.virality} shares
                      </div>
                   </div>

                   <h3 className="text-xl font-bold text-foreground mb-2">{trend.topic}</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed flex-1">{trend.description}</p>
                   
                   <Button variant="outline" className="w-full mt-6 bg-muted/50 border-border hover:bg-muted text-foreground font-semibold">
                      <ShieldAlert className="w-4 h-4 mr-2 text-primary" /> View Full TruthLens Report
                   </Button>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  credibilityScore: number;
  severity: 'Low' | 'Medium' | 'High';
}

const CATEGORIES = ["All Fields", "India", "Maharashtra", "Education", "Technology", "Business", "Sports", "Health", "Science", "International"];

export function NewsCategory() {
  const [activeCategory, setActiveCategory] = useState("All Fields");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${activeCategory}`);
        if (res.ok) {
           const text = await res.text();
           try {
              const data = JSON.parse(text);
              setNews(data);
           } catch(e) { }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-screen">
      {/* Sidebar Categories */}
      <aside className="w-full md:w-64 shrink-0">
         <div className="sticky top-24">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-primary" /> Live Feeds
            </h3>
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mb-8 flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-extrabold text-foreground mb-2">{activeCategory} News</h1>
             <p className="text-muted-foreground">Stay updated with verified information from across the globe.</p>
           </div>
           <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border px-4 py-2 rounded-full shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Live Scanning Active
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card border border-border rounded-3xl p-6 h-48 animate-pulse">
                 <div className="h-6 w-3/4 bg-muted rounded-xl mb-4" />
                 <div className="h-4 w-full bg-muted rounded-xl mb-2" />
                 <div className="h-4 w-5/6 bg-muted rounded-xl mb-8" />
                 <div className="flex justify-between">
                   <div className="h-4 w-24 bg-muted rounded-xl" />
                   <div className="h-4 w-20 bg-muted rounded-xl" />
                 </div>
              </div>
            ))}
          </div>
        ) : (
           <AnimatePresence mode="popLayout">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {news.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx}
                    className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg hover:border-primary/30 transition-all flex flex-col group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                         {item.source}
                       </span>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                         <Clock className="w-3.5 h-3.5" /> {item.date || "Just now"}
                       </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                       <div className="flex items-center gap-2">
                         <div className="text-xs text-muted-foreground">Credibility</div>
                         <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${item.credibilityScore > 80 ? 'bg-emerald-500' : item.credibilityScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                             style={{ width: `${item.credibilityScore}%` }} 
                           />
                         </div>
                         <span className="text-xs font-bold">{item.credibilityScore}%</span>
                       </div>

                       <Button variant="ghost" size="sm" className="text-primary h-8 px-3 rounded-lg hover:bg-primary/10">
                         Read Full
                       </Button>
                    </div>
                  </motion.div>
                ))}
             </div>
           </AnimatePresence>
        )}
      </main>
    </div>
  );
}

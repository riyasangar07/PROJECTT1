import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldCheck, ScanSearch, FileText, Globe, Bot, Image as ImageIcon, Database, Info, LayoutDashboard, Search, TrendingUp, Sparkles, Activity } from 'lucide-react';

export function Home() {
  return (
    <div className="w-full flex-col flex items-center justify-start min-h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-color-dodge" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-color-dodge" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-4 text-center z-10 flex flex-col items-center pt-24 md:pt-36 pb-20">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-primary text-sm font-semibold mb-8 backdrop-blur-md shadow-sm"
        >
           <Sparkles className="w-4 h-4 text-amber-500" />
           The Enterprise-Grade AI Verification Engine
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-[1.1] max-w-5xl"
        >
          Navigate the Noise. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-500">Decode the Truth.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed"
        >
          TruthLens is a next-generation fact-checking platform powered by multi-modal AI. Analyze text, media, and URLs instantly to detect misinformation with clinical precision.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center"
        >
          <Link to="/detect" className="w-[80%] sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 hover:scale-105 transition-all">
              <ScanSearch className="w-5 h-5 mr-2" /> Start Analysis
            </Button>
          </Link>
          <Link to="/chat" className="w-[80%] sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl border-border bg-background/50 backdrop-blur-md hover:bg-muted transition-all">
              <Bot className="w-5 h-5 mr-2 text-primary" /> Ask the AI Assistant
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works Flow */}
      <section className="max-w-7xl mx-auto w-full px-4 py-32 z-10 text-center">
         <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
         >
           <h2 className="text-3xl md:text-5xl font-black mb-6 text-foreground tracking-tight">How It Works</h2>
           <p className="text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">Our multi-stage pipeline guarantees the highest accuracy in deep-learning forensic analysis.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-5 items-center justify-center gap-4 relative">
              <FlowStep step="1" title="Data Ingestion" desc="Drop a URL, Paste Text, or Upload Image" icon={<Search className="w-6 h-6"/>} />
              <div className="hidden md:block h-0.5 bg-gradient-to-r from-border to-primary/50 relative top-[-10px] w-full" />
              <FlowStep step="2" title="AI Extraction" desc="OCR & NLP engines process context" icon={<Activity className="w-6 h-6"/>} />
              <div className="hidden md:block h-0.5 bg-gradient-to-r from-primary/50 to-emerald-500/50 relative top-[-10px] w-full" />
              <FlowStep step="3" title="Forensic Report" desc="Final credibility and risk score" icon={<ShieldCheck className="w-6 h-6"/>} />
           </div>
         </motion.div>
      </section>

      {/* Feature Showcase */}
      <section className="bg-muted/10 w-full border-t border-border">
         <div className="max-w-7xl mx-auto px-4 py-32 z-10">
           <div className="text-center mb-20 text-balance">
             <h2 className="text-3xl md:text-5xl font-black mb-6 text-foreground tracking-tight">Enterprise Infrastructure</h2>
             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Scalable modules built on cutting-edge transformer models to fight misinformation and propaganda.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <FeatureCard 
               icon={<FileText />}
               title="Linguistic Autopsy"
               description="Detect manipulative phrasing, highly charged emotional language, and logical fallacies hidden in raw text."
             />
             <FeatureCard 
               icon={<Globe />}
               title="Live Entity Scraping"
               description="Automatically fetch metadata and cross-verify facts directly from real-time global news API sources."
             />
             <FeatureCard 
               icon={<ImageIcon />}
               title="Optical Forensics"
               description="Extract embedded text from viral screenshots. Our engine parses the pixels to reveal fake context."
             />
             <FeatureCard 
               icon={<Bot />}
               title="Chatbot Interface"
               description="An conversational agent that cites its sources. Challenge claims interactively in real time."
             />
             <FeatureCard 
               icon={<LayoutDashboard />}
               title="Analytics Dashboard"
               description="View trends over time. Monitor what categories of news contain the highest falsification probability."
             />
             <FeatureCard 
               icon={<TrendingUp />}
               title="Reporting & Exports"
               description="Generate professional PDF forensic reports with detailed source breakdowns to share with your team."
             />
           </div>
         </div>
      </section>
    </div>
  );
}

function FlowStep({ step, title, desc, icon }: { step: string, title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center group relative z-10 bg-background/50 p-6 rounded-3xl border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all">
       <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary mb-6 shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h4 className="font-bold text-foreground text-lg mb-2">{title}</h4>
       <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-card border border-border/80 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-primary/20 transition-colors" />
      <div className="w-12 h-12 rounded-xl bg-muted text-primary border border-border flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-colors mix-blend-luminosity">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mt-4">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}


import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Link as LinkIcon, FileText, CheckCircle2, XCircle, AlertTriangle, ScanSearch, Image as ImageIcon, UploadCloud, Info, Database, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, addDoc } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface DetailedAnalysisResult {
  verdict: string;
  truthPercentage: number;
  falsePercentage: number;
  confidenceScore: number;
  credibilityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  explanation: string;
  factCheckSummary: string;
  supportingEvidence: string[];
  potentialConcerns: string[];
  sourcesVerified: string[];
}

export function FakeNewsDetector() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetailedAnalysisResult | null>(null);
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');
  
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    let content = '';
    let mimeType = '';
    
    if (inputType === 'text') content = text;
    else if (inputType === 'url') content = url;
    else if (inputType === 'image') {
        content = imageBase64 || '';
        mimeType = imageFile?.type || '';
    }

    if (!content) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, type: inputType, mimeType })
      });

      if (!res.ok) {
         const textContent = await res.text();
         let errorData: any = {};
         try { errorData = JSON.parse(textContent); } catch (e) {}

         if (res.status === 503) {
           throw new Error(errorData.error || 'AI Assistant is temporarily unavailable.');
         }
         throw new Error(errorData.error || 'Analysis failed');
      }
      const data = await res.json() as DetailedAnalysisResult;
      setResult(data);

      if (user) {
        await addDoc(collection(db, 'analysisHistory'), {
          userId: user.uid,
          type: inputType,
          contentPreview: inputType === 'image' ? 'Image Analysis' : content.substring(0, 100),
          result: data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict?.toLowerCase().includes('true')) return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
    if (verdict?.toLowerCase().includes('false')) return <XCircle className="w-8 h-8 text-rose-500" />;
    return <AlertTriangle className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
              Diagnostic Engine v2.0
        </div>
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Information Verification</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Analyze content instantly using our multi-model AI pipeline. Uncover bias, check facts, and determine credibility.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-2 sm:p-2 shadow-sm mb-8">
        <div className="flex bg-muted/50 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setInputType('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              inputType === 'text' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <FileText className="w-4 h-4" /> Text
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              inputType === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Link
          </button>
          <button
            onClick={() => setInputType('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              inputType === 'image' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Image OCR
          </button>
        </div>

        <div className="p-4 sm:p-6 pt-0">
          {inputType === 'text' && (
             <div className="space-y-4 relative">
                <Label className="text-foreground">Paste Article Text</Label>
                <Textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Paste the news text or claims here for analysis..."
                  className="min-h-[200px] resize-y bg-background border-border text-base focus-visible:ring-primary/20"
                />
             </div>
          )}

          {inputType === 'url' && (
            <div className="space-y-4">
               <Label className="text-foreground">Article or Social Media URL</Label>
               <Input 
                 value={url} 
                 onChange={(e) => setUrl(e.target.value)} 
                 placeholder="https://example.com/article"
                 className="h-14 bg-background border-border"
               />
               <p className="text-xs text-muted-foreground">The platform will scrape and analyze the contents of the provided link.</p>
            </div>
          )}

          {inputType === 'image' && (
            <div className="space-y-4">
               <Label className="text-foreground">Upload Screenshot or Image</Label>
               <div 
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${imageBase64 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-background/50'}`}
                  onClick={() => fileInputRef.current?.click()}
               >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {imageBase64 ? (
                     <div className="flex flex-col items-center">
                        <img src={imageBase64} alt="Preview" className="max-h-[200px] rounded-lg mb-4 shadow-sm" />
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setImageBase64(null); setImageFile(null); }}>Remove Image</Button>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center text-muted-foreground cursor-pointer">
                        <UploadCloud className="w-12 h-12 mb-4 text-primary/80" />
                        <p className="font-medium text-foreground">Click or drag image to upload</p>
                        <p className="text-sm mt-1">Supports JPG, PNG, WEBP</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          <Button 
            className="w-full mt-6 h-14 text-base font-semibold rounded-xl text-white"
            onClick={handleAnalyze} 
            disabled={loading || (inputType === 'text' && !text) || (inputType === 'url' && !url) || (inputType === 'image' && !imageBase64)}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ScanSearch className="w-5 h-5 mr-2" />}
            {loading ? 'Running AI Diagnostics...' : 'Analyze Evidence'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="grid grid-cols-1 lg:grid-cols-3 gap-6"
             id="report-container"
          >
            {/* Primary Metrics Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex gap-2 w-full">
                 <Button onClick={() => window.print()} variant="outline" className="flex-1 bg-card text-foreground border-border hover:bg-muted font-semibold">
                    Export PDF
                 </Button>
                 {user && (
                    <Button onClick={async () => {
                        try {
                           await addDoc(collection(db, 'savedReports'), {
                              userId: user.uid,
                              type: inputType,
                              contentPreview: inputType === 'image' ? 'Image Analysis' : (inputType === 'text' ? text.substring(0, 100) : url),
                              result: result,
                              timestamp: new Date().toISOString()
                           });
                           toast.success('Report saved to Dashboard!');
                        } catch(err) {
                           console.error(err);
                           toast.error('Failed to save report');
                        }
                    }} className="flex-1 font-semibold">
                       Save Report
                    </Button>
                 )}
              </div>
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    {getVerdictIcon(result.verdict)}
                 </div>
                 <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Final Verdict</h3>
                 <div className="flex items-center justify-center gap-3 mb-2">
                    {getVerdictIcon(result.verdict)}
                    <h2 className="text-3xl font-black text-foreground">{result.verdict}</h2>
                 </div>
                 
                 <div className="w-full h-px bg-border my-6" />
                 
                 <div className="w-full space-y-5">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-muted-foreground">Truth Probability</span>
                        <span className="font-bold text-emerald-500">{result.truthPercentage}%</span>
                      </div>
                      <Progress value={result.truthPercentage} className="h-2 bg-emerald-500/20" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-muted-foreground">False Probability</span>
                        <span className="font-bold text-rose-500">{result.falsePercentage}%</span>
                      </div>
                      <Progress value={result.falsePercentage} className="h-2 bg-rose-500/20" />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-card border border-border rounded-3xl p-5 shadow-sm text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground mb-2 mx-auto">
                          Confidence <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>AI Model Confidence</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-2xl font-bold text-foreground">{result.confidenceScore}%</div>
                 </div>
                 <div className={`rounded-3xl p-5 border text-center ${getRiskColor(result.riskLevel)}`}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 text-sm font-medium mb-2 mx-auto uppercase tracking-wider opacity-80">
                          Risk <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>Potential Harm or Deception Risk</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-xl font-bold">{result.riskLevel}</div>
                 </div>
              </div>
            </div>

            {/* Detailed Report Main View */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                    <Bot className="w-5 h-5 text-primary" /> AI Detailed Analysis
                  </h3>
                  <div className="text-muted-foreground leading-relaxed">
                     <p>{result.explanation}</p>
                  </div>
               </div>

               <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Fact Check Summary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-2xl border border-border/50 shadow-inner">
                    {result.factCheckSummary}
                  </p>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  {result.potentialConcerns && result.potentialConcerns.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 shadow-sm">
                        <h4 className="font-bold text-rose-500 flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-4 h-4" /> Potential Concerns
                        </h4>
                        <ul className="space-y-3">
                          {result.potentialConcerns.map((concern, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                  )}

                  {result.supportingEvidence && result.supportingEvidence.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 shadow-sm">
                        <h4 className="font-bold text-emerald-500 flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-4 h-4" /> Supporting Evidence
                        </h4>
                        <ul className="space-y-3">
                          {result.supportingEvidence.map((ev, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                  )}
               </div>

               {result.sourcesVerified && result.sourcesVerified.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h4 className="font-bold flex items-center gap-2 mb-4 text-primary">
                        <Database className="w-4 h-4" /> Related Verified Sources
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sourcesVerified.map((source, i) => (
                          <span key={i} className="px-3 py-1.5 bg-muted text-foreground text-sm font-medium rounded-full border border-border shadow-sm">
                            {source}
                          </span>
                        ))}
                      </div>
                  </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

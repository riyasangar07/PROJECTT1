import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, RefreshCcw, Search, FileText, Zap, ShieldQuestion, Volume2, Mic, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, addDoc, query, where, getDocs, orderBy, limit, writeBatch } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const SUGGESTED_PROMPTS = [
    { text: "Verify a recent news story", icon: Search },
    { text: "Explain deepfakes", icon: ShieldQuestion },
    { text: "Tips for spotting fake news", icon: Zap },
    { text: "Summarize an article for me", icon: FileText },
];

function TypewriterEffect({ content }: { content: string }) {
    const [displayed, setDisplayed] = useState("");
    
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(content.substring(0, i));
            i += 5; // Fast typing
            if (i > content.length) {
                setDisplayed(content);
                clearInterval(interval);
            }
        }, 10);
        return () => clearInterval(interval);
    }, [content]);

    return (
       <div className="markdown-body prose prose-sm dark:prose-invert max-w-none text-[15px]">
          <Markdown>{displayed}</Markdown>
       </div>
    );
}

export function Chatbot() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! I am TruthLens AI. How can I assist you with fact-checking, understanding complex news, or spotting misinformation today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(db, 'chatMessages'),
                    where('userId', '==', user.uid)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const loadedMessages: ChatMessage[] = [];
                    const docsArr = querySnapshot.docs.map(d => d.data());
                    docsArr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    const recentDocs = docsArr.slice(-20);
                    
                    recentDocs.forEach(data => {
                        loadedMessages.push({ role: 'user', content: data.userMessage });
                        loadedMessages.push({ role: 'model', content: data.botResponse });
                    });
                    // Only merge if we aren't appending indefinitely
                    // Actually, if we merge, we should prepend the loaded ones and strip the initial greeting maybe?
                    if (loadedMessages.length > 0) {
                        setMessages(loadedMessages);
                    }
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();
    }, [user]);

    const handleSend = async (textToSend: string = input) => {
        if (!textToSend.trim()) return;
        const newMsg: ChatMessage = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            // Filter out any model messages at the start of the conversation, 
            // because Gemini API requires the first message in history to be from the 'user'.
            const historyToSend = [...messages, newMsg];
            const firstUserIdx = historyToSend.findIndex(m => m.role === 'user');
            const validHistory = firstUserIdx >= 0 ? historyToSend.slice(firstUserIdx) : historyToSend;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: validHistory })
            });
            
            if (!res.ok) {
                // If it's HTML or some non-JSON proxy error, handle safely
                const text = await res.text();
                let errorData;
                try { errorData = JSON.parse(text); } catch(e) { }

                if (res.status === 503) {
                   throw new Error("AI Assistant is temporarily unavailable. Please try again later.");
                }
                throw new Error((errorData && errorData.error) || 'Failed to get response');
            }
            
            const data = await res.json();
            
            const botResponse = { role: 'model', content: data.text || "No response received from AI." } as ChatMessage;
            setMessages(prev => [...prev, botResponse]);

            if (user && (data.text || "No response received from AI.")) {
                await addDoc(collection(db, 'chatMessages'), {
                    userId: user.uid,
                    userMessage: newMsg.content,
                    botResponse: data.text || "No response received from AI.",
                    timestamp: new Date().toISOString()
                });
            }
        } catch(err: any) {
            console.error(err);
            const errorMsg = err.message || "Network error. Please try again.";
            toast.error(errorMsg);
            setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (user) {
           try {
               const q = query(collection(db, 'chatMessages'), where('userId', '==', user.uid));
               const snapshot = await getDocs(q);
               const batch = writeBatch(db);
               snapshot.docs.forEach(doc => {
                   batch.delete(doc.ref);
               });
               await batch.commit();
               toast.success("History deleted");
           } catch(e) {
               console.error("Failed to delete history", e);
           }
        }
        setMessages([{ role: 'model', content: "Chat history cleared. How can I help you now?" }]);
    };

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) {
            toast.error("Text-to-speech not supported in this browser.");
            return;
        }
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const listen = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition not supported in this browser.");
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Message copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:py-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div>
                 <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                   <div className="p-2 bg-primary/10 rounded-xl">
                      <Bot className="w-6 h-6 text-primary" />
                   </div>
                   TruthLens Assistant
                 </h1>
                 <p className="text-muted-foreground mt-1 text-sm">Your personal guide to navigating the complex information landscape.</p>
               </div>
               <Button variant="outline" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                   <RefreshCcw className="w-4 h-4 mr-2" /> Reset
               </Button>
            </div>

            <div className="flex-1 bg-card border border-border rounded-3xl p-4 sm:p-6 overflow-y-auto mb-4 shadow-sm relative hide-scrollbar">
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card to-transparent pointer-events-none z-10" />
                <div className="space-y-6">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => {
                            const isLastMessage = idx === messages.length - 1;
                            const enableTypingEffect = isLastMessage && msg.role === 'model' && !loading;

                            return (
                             <motion.div 
                                 initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 key={idx} 
                                 className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                             >
                                 {msg.role === 'model' && (
                                     <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center mt-1">
                                         <Bot className="w-5 h-5 text-primary" />
                                     </div>
                                 )}
                                 <div className={`p-4 max-w-[90%] sm:max-w-[80%] shadow-sm ${
                                     msg.role === 'user' 
                                         ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                                         : 'bg-muted/50 border border-border text-foreground rounded-2xl rounded-tl-sm group relative'
                                 }`}>
                                     {enableTypingEffect ? (
                                         <TypewriterEffect content={msg.content} />
                                     ) : (
                                         <div className="markdown-body prose prose-sm dark:prose-invert max-w-none text-[15px]">
                                             <Markdown>{msg.content}</Markdown>
                                         </div>
                                     )}
                                     <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>

                                     {msg.role === 'model' && (
                                        <div className="absolute -right-12 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8 bg-background/50 backdrop-blur-sm border border-border shadow-sm rounded-lg"
                                                onClick={() => handleCopy(msg.content, idx)}
                                            >
                                                {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8 bg-background/50 backdrop-blur-sm border border-border shadow-sm rounded-lg"
                                                onClick={() => speak(msg.content)}
                                            >
                                                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-primary' : ''}`} />
                                            </Button>
                                        </div>
                                     )}
                                 </div>
                                 {msg.role === 'user' && (user?.photoURL ? (
                                     <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-border mt-1" />
                                 ) : (
                                     <div className="w-10 h-10 rounded-full bg-secondary flex flex-shrink-0 border border-border items-center justify-center mt-1">
                                         <User className="w-5 h-5 text-secondary-foreground" />
                                     </div>
                                 ))}
                             </motion.div>
                            )
                        })}
                        {loading && (
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="flex gap-4 justify-start"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-1">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div className="p-4 bg-muted/50 border border-border rounded-2xl rounded-tl-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {messages.length <= 2 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                         {SUGGESTED_PROMPTS.map((prompt, i) => (
                             <button
                                 key={i}
                                 onClick={() => handleSend(prompt.text)}
                                 className="flex items-center justify-center sm:justify-start gap-2 p-2 px-3 text-left text-xs bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all truncate"
                             >
                                 <prompt.icon className="w-3 h-3 shrink-0 hidden sm:block" />
                                 <span className="truncate">{prompt.text}</span>
                             </button>
                         ))}
                    </div>
                )}
                <div className="flex gap-3 bg-card p-3 rounded-3xl border border-border shadow-sm items-center pr-2 relative focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`rounded-full shrink-0 h-10 w-10 ${isListening ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        onClick={listen}
                    >
                        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about a news piece or rumor..."
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 placeholder:text-muted-foreground/70"
                    />
                    <Button 
                        onClick={() => handleSend(input)} 
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95 shrink-0"
                    >
                        <Send className="w-5 h-5 ml-1" />
                    </Button>
                </div>
                <div className="text-center text-[10px] text-muted-foreground mt-1 opacity-60">
                   AI can make mistakes. Consider verifying important information.
                </div>
            </div>
        </div>
    );
}

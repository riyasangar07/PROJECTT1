import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Menu, X, LogOut, Newspaper, Search, Bot, LayoutDashboard, User, TrendingUp, History } from 'lucide-react';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Detector', path: '/detect', icon: Search },
    { name: 'News Feed', path: '/news', icon: Newspaper },
    { name: 'AI Assistant', path: '/chat', icon: Bot },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
          <ShieldCheck className="text-primary w-6 h-6" />
          <span className="hidden sm:inline-block">TruthLens<span className="text-primary">AI</span></span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-1 mx-auto bg-muted/20 p-1 rounded-full border border-border">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link key={link.path} to={link.path} className={cn("text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full transition-all flex items-center gap-2", isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
           <ThemeToggle />
           <div className="hidden md:flex items-center gap-2">
             {user && (
               <DropdownMenu>
                 <DropdownMenuTrigger className="flex items-center gap-2 h-9 p-1 pl-1 pr-3 rounded-full hover:bg-muted border border-transparent hover:border-border transition-all flex-shrink-0 focus-visible:outline-none">
                     {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border border-border" />
                     ) : (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                            {user.displayName?.charAt(0) || 'U'}
                        </div>
                     )}
                     <span className="text-xs text-foreground font-medium max-w-[80px] truncate">{user.displayName?.split(' ')[0]}</span>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56">
                   <Link to="/profile">
                     <DropdownMenuItem className="cursor-pointer">
                       <User className="mr-2 h-4 w-4" />
                       Profile Settings
                     </DropdownMenuItem>
                   </Link>
                   <Link to="/dashboard">
                     <DropdownMenuItem className="cursor-pointer">
                       <LayoutDashboard className="mr-2 h-4 w-4" />
                       Analytics Dashboard
                     </DropdownMenuItem>
                   </Link>
                   <Link to="/saved-reports">
                     <DropdownMenuItem className="cursor-pointer">
                       <Search className="mr-2 h-4 w-4" />
                       Saved Reports
                     </DropdownMenuItem>
                   </Link>
                   <Link to="/history">
                     <DropdownMenuItem className="cursor-pointer">
                       <History className="mr-2 h-4 w-4" />
                       Analysis History
                     </DropdownMenuItem>
                   </Link>
                   <Link to="/trending">
                     <DropdownMenuItem className="cursor-pointer">
                       <TrendingUp className="mr-2 h-4 w-4" />
                       Trending Fake News
                     </DropdownMenuItem>
                   </Link>
                   <Link to="/settings">
                     <DropdownMenuItem className="cursor-pointer">
                       <User className="mr-2 h-4 w-4" />
                       Settings
                     </DropdownMenuItem>
                   </Link>
                   {(user?.email === 'riyasangar07@gmail.com' || user?.email?.includes('admin') || db.isMock()) && (
                     <Link to="/admin">
                       <DropdownMenuItem className="cursor-pointer font-bold text-amber-500">
                         <ShieldCheck className="mr-2 h-4 w-4" />
                         Admin Panel
                       </DropdownMenuItem>
                     </Link>
                   )}
                   <DropdownMenuSeparator />
                   <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={signOut}>
                     <LogOut className="mr-2 h-4 w-4" />
                     Sign Out
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}
           </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={cn("text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-3 transition-colors", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                )
              })}
              <div className="pt-4 mt-2 border-t border-border flex items-center justify-between">
                 {user && (
                   <>
                     <div className="flex items-center gap-3">
                       {user.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-border" />
                       ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
                              {user.displayName?.charAt(0) || 'U'}
                          </div>
                       )}
                       <span className="text-sm font-medium text-foreground">{user.displayName}</span>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => { signOut(); setIsOpen(false); }} className="h-8 border-border text-xs">
                       <LogOut className="w-3 h-3 mr-2" /> Log Out
                     </Button>
                   </>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}


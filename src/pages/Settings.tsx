import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, Lock, Monitor, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const { user } = useAuth();

  const handleSave = () => {
     toast.success("Settings saved successfully.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <div className="md:col-span-1 space-y-2">
            <button className="w-full text-left px-4 py-2 bg-primary/10 text-primary font-semibold rounded-xl text-sm">General</button>
            <button className="w-full text-left px-4 py-2 text-muted-foreground hover:bg-muted font-medium rounded-xl text-sm transition-colors">Notifications</button>
            <button className="w-full text-left px-4 py-2 text-muted-foreground hover:bg-muted font-medium rounded-xl text-sm transition-colors">Security</button>
         </div>

         <div className="md:col-span-3 space-y-8">
            <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> Appearance</h3>
               <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                     <p className="font-semibold text-foreground">Theme</p>
                     <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                  </div>
                  <ThemeToggle />
               </div>
            </section>

            <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</h3>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                           <p className="font-semibold text-foreground">Email Alerts</p>
                           <p className="text-sm text-muted-foreground">Receive weekly analysis digests.</p>
                        </div>
                     </div>
                     <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                           <p className="font-semibold text-foreground">Push Notifications</p>
                           <p className="text-sm text-muted-foreground">Get notified about trending fake news instantly.</p>
                        </div>
                     </div>
                     <input type="checkbox" className="w-5 h-5 accent-primary" />
                  </div>
               </div>
            </section>

            <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Privacy & Security</h3>
               <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                     <p className="font-semibold text-foreground">Data Sharing</p>
                     <p className="text-sm text-muted-foreground">Allow anonymous usage data for model training.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
               </div>
               
               <Button variant="outline" className="w-full sm:w-auto font-semibold">Change Password</Button>
            </section>

            <div className="flex justify-end">
               <Button onClick={handleSave} className="font-semibold px-8 h-12 shadow-md">Save Changes</Button>
            </div>
         </div>
      </div>
    </div>
  );
}

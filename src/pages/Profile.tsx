import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Loader2, Save, Mail, ShieldAlert } from 'lucide-react';
import { db, auth, updateProfile, doc, setDoc } from '@/lib/firebase';
import { toast } from 'sonner';

export function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (!auth.currentUser) throw new Error("No active auth session");
      
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photoURL
      });

      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: photoURL,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0 flex items-center justify-center">
             {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-muted object-cover shadow-sm" />
             ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                   <User className="w-12 h-12" />
                </div>
             )}
          </div>
          
          <form className="flex-1 space-y-6 w-full" onSubmit={handleSave}>
            <div>
              <Label className="text-foreground">Full Name</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label className="text-foreground">Profile Photo URL</Label>
              <Input 
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="mt-1"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Provide a public image URL for your avatar.</p>
            </div>

            <div>
              <Label className="text-foreground">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={user?.email || ''}
                  disabled
                  className="pl-9 bg-muted/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
            </div>

            <Button type="submit" disabled={loading} className="mt-4">
               {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
               Save Changes
            </Button>
          </form>
        </div>
      </div>
      
      <div className="mt-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-rose-500 flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Permanently delete your account and all associated data, including analysis history, saved reports, and chat logs. This action cannot be undone.
          </p>
          <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}

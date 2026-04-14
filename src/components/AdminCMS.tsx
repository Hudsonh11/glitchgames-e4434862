import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Edit, Trash2, Check, X, AlertTriangle,
  Info, Bell, Calendar, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  active: boolean;
  priority: number;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-primary" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  update: <Bell className="w-4 h-4 text-secondary" />,
  event: <Calendar className="w-4 h-4 text-success" />,
};

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-primary/10 border-primary/30',
  warning: 'bg-warning/10 border-warning/30',
  update: 'bg-secondary/10 border-secondary/30',
  event: 'bg-success/10 border-success/30',
};

const AdminCMS: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'info', priority: 0 });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast({ title: 'Error', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('announcements').update({
        title: form.title, content: form.content, type: form.type, priority: form.priority,
      }).eq('id', editingId);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Updated', description: 'Announcement updated.' });
    } else {
      const { error } = await supabase.from('announcements').insert({
        title: form.title, content: form.content, type: form.type, priority: form.priority,
        author_id: user?.id || '',
      });
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Created', description: 'Announcement published.' });
    }

    setForm({ title: '', content: '', type: 'info', priority: 0 });
    setShowForm(false);
    setEditingId(null);
    fetchAnnouncements();
  };

  const handleEdit = (a: Announcement) => {
    setForm({ title: a.title, content: a.content, type: a.type, priority: a.priority });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('announcements').update({ active: !active }).eq('id', id);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast({ title: 'Deleted', description: 'Announcement removed.' });
    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Content Management
        </h2>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', content: '', type: 'info', priority: 0 }); }}>
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h3 className="font-display font-bold">{editingId ? 'Edit' : 'New'} Announcement</h3>
          <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea
            placeholder="Content..."
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-4">
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="update">🔔 Update</SelectItem>
                <SelectItem value="event">🎉 Event</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} className="w-28" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" /> {editingId ? 'Update' : 'Publish'}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border ${TYPE_COLORS[a.type] || 'bg-card border-border'} ${!a.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {TYPE_ICONS[a.type]}
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm">{a.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Priority: {a.priority} • {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch checked={a.active} onCheckedChange={() => handleToggleActive(a.id, a.active)} />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(a)} className="h-8 w-8 p-0">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AdminCMS;

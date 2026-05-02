import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Trash2 } from 'lucide-react';

const AdminMaintenance: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');

  const load = async () => {
    const { data } = await supabase.from('scheduled_maintenance').select('*').order('starts_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title || !starts || !ends) { toast({ title: 'Fill all required fields', variant: 'destructive' }); return; }
    const { error } = await supabase.from('scheduled_maintenance').insert({ title, message, starts_at: starts, ends_at: ends });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Maintenance scheduled' });
    setTitle(''); setMessage(''); setStarts(''); setEnds(''); load();
  };

  const remove = async (id: string) => {
    await supabase.from('scheduled_maintenance').delete().eq('id', id);
    toast({ title: 'Deleted' }); load();
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Calendar />Scheduled Maintenance</h3>
      <div className="space-y-3 mb-6 p-4 border rounded-lg">
        <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Message to users" value={message} onChange={e => setMessage(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs">Starts</label><Input type="datetime-local" value={starts} onChange={e => setStarts(e.target.value)} /></div>
          <div><label className="text-xs">Ends</label><Input type="datetime-local" value={ends} onChange={e => setEnds(e.target.value)} /></div>
        </div>
        <Button onClick={create} className="w-full">Schedule</Button>
      </div>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <p className="font-semibold">{i.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(i.starts_at).toLocaleString()} → {new Date(i.ends_at).toLocaleString()}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No scheduled maintenance.</p>}
      </div>
    </Card>
  );
};

export default AdminMaintenance;

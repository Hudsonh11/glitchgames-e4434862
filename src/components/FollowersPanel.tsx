import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserMinus, Search } from 'lucide-react';

interface Profile { user_id: string; username: string; level: number; }

const FollowersPanel: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    const { data: f1 } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
    const { data: f2 } = await supabase.from('followers').select('follower_id').eq('following_id', user.id);
    const followingIds = (f1 || []).map(f => f.following_id);
    const followerIds = (f2 || []).map(f => f.follower_id);
    setFollowingIds(new Set(followingIds));
    if (followingIds.length) {
      const { data } = await supabase.from('profiles').select('user_id, username, level').in('user_id', followingIds);
      setFollowing(data || []);
    } else setFollowing([]);
    if (followerIds.length) {
      const { data } = await supabase.from('profiles').select('user_id, username, level').in('user_id', followerIds);
      setFollowers(data || []);
    } else setFollowers([]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const doSearch = async () => {
    if (!search.trim()) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('user_id, username, level').ilike('username', `%${search.trim()}%`).neq('user_id', user?.id || '').limit(20);
    setResults(data || []);
  };

  const follow = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('followers').insert({ follower_id: user.id, following_id: id });
    if (error) { toast({ title: 'Already following', variant: 'destructive' }); return; }
    toast({ title: 'Following!' }); load();
  };

  const unfollow = async (id: string) => {
    if (!user) return;
    await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', id);
    toast({ title: 'Unfollowed' }); load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Search className="w-4 h-4" />Find People</h3>
        <div className="flex gap-2 mb-4">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username..." onKeyDown={e => e.key === 'Enter' && doSearch()} />
          <Button onClick={doSearch}>Search</Button>
        </div>
        <div className="space-y-2">
          {results.map(p => (
            <div key={p.user_id} className="flex items-center justify-between p-2 border rounded-lg">
              <span><b>{p.username}</b> · Lvl {p.level}</span>
              {followingIds.has(p.user_id)
                ? <Button size="sm" variant="outline" onClick={() => unfollow(p.user_id)}><UserMinus className="w-4 h-4 mr-1" />Unfollow</Button>
                : <Button size="sm" onClick={() => follow(p.user_id)}><UserPlus className="w-4 h-4 mr-1" />Follow</Button>}
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold mb-3">Following ({following.length})</h3>
          <div className="space-y-2">
            {following.map(p => (
              <div key={p.user_id} className="flex items-center justify-between p-2 border rounded-lg">
                <span><b>{p.username}</b> · Lvl {p.level}</span>
                <Button size="sm" variant="outline" onClick={() => unfollow(p.user_id)}><UserMinus className="w-4 h-4" /></Button>
              </div>
            ))}
            {following.length === 0 && <p className="text-sm text-muted-foreground">Not following anyone yet.</p>}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-3">Followers ({followers.length})</h3>
          <div className="space-y-2">
            {followers.map(p => (
              <div key={p.user_id} className="flex items-center justify-between p-2 border rounded-lg">
                <span><b>{p.username}</b> · Lvl {p.level}</span>
              </div>
            ))}
            {followers.length === 0 && <p className="text-sm text-muted-foreground">No followers yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FollowersPanel;

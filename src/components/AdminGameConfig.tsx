import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gamepad2 } from 'lucide-react';

const KNOWN_GAMES = [
  'snake', 'tetris', '2048', 'chess', 'checkers', 'connectfour', 'tictactoe',
  'pong', 'breakout', 'pacman', 'spaceinvaders', 'asteroids', 'flappy', 'dinorun',
  'memory', 'simon', 'sudoku', 'minesweeper', 'wordle', 'hangman'
];

const AdminGameConfig: React.FC = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<Record<string, { enabled: boolean; difficulty: string }>>({});
  const [search, setSearch] = useState('');

  const load = async () => {
    const { data } = await supabase.from('game_config').select('*');
    const map: Record<string, any> = {};
    KNOWN_GAMES.forEach(g => { map[g] = { enabled: true, difficulty: 'normal' }; });
    data?.forEach(c => { map[c.game_id] = { enabled: c.enabled, difficulty: c.difficulty }; });
    setConfigs(map);
  };
  useEffect(() => { load(); }, []);

  const update = async (gameId: string, updates: Partial<{ enabled: boolean; difficulty: string }>) => {
    const next = { ...configs[gameId], ...updates };
    setConfigs(prev => ({ ...prev, [gameId]: next }));
    await supabase.from('game_config').upsert({ game_id: gameId, ...next, updated_at: new Date().toISOString() }, { onConflict: 'game_id' });
    toast({ title: `${gameId} updated` });
  };

  const filtered = Object.entries(configs).filter(([g]) => g.includes(search.toLowerCase()));

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Gamepad2 />Per-Game Configuration</h3>
      <Input placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(([gameId, cfg]) => (
          <div key={gameId} className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-semibold capitalize">{gameId}</span>
            <div className="flex items-center gap-3">
              <select value={cfg.difficulty} onChange={e => update(gameId, { difficulty: e.target.value })} className="text-sm rounded border bg-background px-2 py-1">
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
              <Switch checked={cfg.enabled} onCheckedChange={v => update(gameId, { enabled: v })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AdminGameConfig;

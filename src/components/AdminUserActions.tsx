import React, { useState } from 'react';
import { Coins, Gem, Plus, Minus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminUserActionsProps {
  userId: string;
  username: string;
  currentCoins: number;
  currentGems: number;
  onUpdate: () => void;
}

const AdminUserActions: React.FC<AdminUserActionsProps> = ({
  userId,
  username,
  currentCoins,
  currentGems,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [coinAmount, setCoinAmount] = useState('');
  const [gemAmount, setGemAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleModifyCurrency = async (type: 'coins' | 'gems', action: 'add' | 'remove') => {
    const amount = parseInt(type === 'coins' ? coinAmount : gemAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number.',
        variant: 'destructive',
      });
      return;
    }

    const currentAmount = type === 'coins' ? currentCoins : currentGems;
    const newAmount = action === 'add' 
      ? currentAmount + amount 
      : Math.max(0, currentAmount - amount);

    const { error } = await supabase
      .from('profiles')
      .update({ [type]: newAmount })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update currency.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Currency Updated',
      description: `${action === 'add' ? 'Added' : 'Removed'} ${amount} ${type} ${action === 'add' ? 'to' : 'from'} ${username}'s account.`,
    });

    setCoinAmount('');
    setGemAmount('');
    onUpdate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Coins className="w-4 h-4 mr-1" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage {username}'s Currency</DialogTitle>
          <DialogDescription>
            Add or remove coins and gems from this user's account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Balances */}
          <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span className="font-display font-bold text-warning">{currentCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span className="font-display font-bold text-secondary">{currentGems.toLocaleString()}</span>
            </div>
          </div>

          {/* Coins Management */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">🪙</span> Coins
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleModifyCurrency('coins', 'add')}
                className="text-success hover:text-success"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleModifyCurrency('coins', 'remove')}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Gems Management */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">💎</span> Gems
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={gemAmount}
                onChange={(e) => setGemAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleModifyCurrency('gems', 'add')}
                className="text-success hover:text-success"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleModifyCurrency('gems', 'remove')}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserActions;

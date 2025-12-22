import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, Gamepad2, AlertTriangle, Ban, Trash2, 
  Power, PowerOff, Search, Shield, UserX, UserCheck,
  RefreshCw, Download, Settings, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import AdminWelcome from '@/components/AdminWelcome';
import AdminStats from '@/components/AdminStats';
import AdminUserActions from '@/components/AdminUserActions';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Admin: React.FC = () => {
  const { 
    user, 
    isLoggedIn, 
    isLoading,
    gamesShutdown, 
    setGamesShutdown, 
    bannedUsers, 
    banUser, 
    unbanUser, 
    deleteUser,
    leaderboard,
    allUsers,
    fetchAllUsers,
  } = useGame();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.isAdmin && !showWelcome) {
      fetchAllUsers();
      fetchCurrencyStats();
    }
  }, [user?.isAdmin, showWelcome]);

  const fetchCurrencyStats = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('coins, gems');
    
    if (data) {
      setTotalCoins(data.reduce((sum, p) => sum + p.coins, 0));
      setTotalGems(data.reduce((sum, p) => sum + p.gems, 0));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllUsers();
    await fetchCurrencyStats();
    setIsRefreshing(false);
    toast({ title: 'Data Refreshed', description: 'All stats have been updated.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show welcome screen for admins
  if (showWelcome) {
    return <AdminWelcome onAccessGranted={() => setShowWelcome(false)} />;
  }

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBanUser = async (userId: string, username: string) => {
    await banUser(userId);
    toast({
      title: 'User Banned',
      description: `${username} has been banned from the platform.`,
    });
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    await unbanUser(userId);
    toast({
      title: 'User Unbanned',
      description: `${username} has been unbanned.`,
    });
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    await deleteUser(userId);
    toast({
      title: 'User Deleted',
      description: `${username}'s account has been permanently deleted.`,
      variant: 'destructive',
    });
  };

  const toggleGamesShutdown = async () => {
    await setGamesShutdown(!gamesShutdown);
    toast({
      title: gamesShutdown ? 'Games Enabled' : 'Games Disabled',
      description: gamesShutdown 
        ? 'All games are now available to players.'
        : 'All games have been temporarily shut down.',
    });
  };

  const stats = {
    totalUsers: allUsers.length,
    bannedUsers: bannedUsers.length,
    activeGames: gamesShutdown ? 0 : 15,
    totalScores: leaderboard.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center">
                <Crown className="w-7 h-7 text-warning" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Manage users, games, and platform settings</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="mb-8">
            <AdminStats
              totalUsers={stats.totalUsers}
              bannedUsers={stats.bannedUsers}
              activeGames={stats.activeGames}
              totalScores={stats.totalScores}
              totalCoinsInCirculation={totalCoins}
              totalGemsInCirculation={totalGems}
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Game Controls */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                Game Controls
              </h2>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {gamesShutdown ? (
                    <PowerOff className="w-6 h-6 text-destructive" />
                  ) : (
                    <Power className="w-6 h-6 text-success" />
                  )}
                  <div>
                    <p className="font-medium">Game Status</p>
                    <p className={`text-sm ${gamesShutdown ? 'text-destructive' : 'text-success'}`}>
                      {gamesShutdown ? 'All games are OFFLINE' : 'All games are ONLINE'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!gamesShutdown}
                  onCheckedChange={toggleGamesShutdown}
                />
              </div>

              {gamesShutdown && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Maintenance Mode Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Players cannot access any games while this is enabled.
                  </p>
                </div>
              )}
            </div>

            {/* Platform Status */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Platform Status
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span>Cloud Database</span>
                  <span className="text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span>Auth System</span>
                  <span className="text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span>Games Server</span>
                  <span className={`flex items-center gap-1 ${gamesShutdown ? 'text-destructive' : 'text-success'}`}>
                    <span className={`w-2 h-2 rounded-full ${gamesShutdown ? 'bg-destructive' : 'bg-success animate-pulse'}`} />
                    {gamesShutdown ? 'Offline' : 'Running'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                User Management
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-display">User</th>
                    <th className="text-left py-3 px-4 font-display">Joined</th>
                    <th className="text-left py-3 px-4 font-display">Status</th>
                    <th className="text-right py-3 px-4 font-display">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isBanned = bannedUsers.includes(u.id);
                    const isCurrentUser = u.id === user?.id;
                    
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{u.username}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(u.joinDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {isBanned ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive">
                              Banned
                            </span>
                          ) : u.isAdmin ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {!isCurrentUser && (
                              <>
                                {isBanned ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnbanUser(u.id, u.username)}
                                    className="text-success hover:text-success"
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBanUser(u.id, u.username)}
                                    className="text-warning hover:text-warning"
                                  >
                                    <UserX className="w-4 h-4 mr-1" />
                                    Ban
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground">Current user</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

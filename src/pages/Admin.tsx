import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, Users, Gamepad2, AlertTriangle, Ban, Trash2, 
  Power, PowerOff, Search, Shield, UserX, UserCheck,
  RefreshCw, BarChart3, Activity, Clock, TrendingUp,
  Eye, Database, Coins, Gem, Award, Flag, FileText,
  Bell, Megaphone, Lock, Unlock, Mail, Download, Upload,
  Filter, ArrowUpDown, ChevronDown, CheckCircle, XCircle,
  Zap, Globe, Server, Cpu, HardDrive, Settings, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import AdminWelcome from '@/components/AdminWelcome';
import AdminStats from '@/components/AdminStats';
import AdminUserActions from '@/components/AdminUserActions';
import AdminAnalytics from '@/components/AdminAnalytics';
import AdminCMS from '@/components/AdminCMS';
import AdminUserDetail from '@/components/AdminUserDetail';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  timestamp: Date;
  type: 'ban' | 'unban' | 'delete' | 'system' | 'currency';
}

const Admin: React.FC = () => {
  const { 
    user, isLoggedIn, isLoading,
    gamesShutdown, setGamesShutdown, 
    bannedUsers, banUser, unbanUser, deleteUser,
    leaderboard, allUsers, fetchAllUsers,
  } = useGame();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [gameCount] = useState(60);
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAdmin && !showWelcome) {
      fetchAllUsers();
      fetchCurrencyStats();
    }
  }, [user?.isAdmin, showWelcome]);

  const fetchCurrencyStats = async () => {
    const { data } = await supabase.from('profiles').select('coins, gems');
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

  const addToLog = (action: string, target: string, type: ActivityLog['type']) => {
    setActivityLog(prev => [{ id: crypto.randomUUID(), action, target, timestamp: new Date(), type }, ...prev.slice(0, 49)]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (showWelcome) {
    return <AdminWelcome onAccessGranted={() => setShowWelcome(false)} />;
  }

  const filteredUsers = allUsers
    .filter(u => {
      if (!u.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (userFilter === 'banned') return bannedUsers.includes(u.id);
      if (userFilter === 'admin') return u.isAdmin;
      if (userFilter === 'active') return !bannedUsers.includes(u.id);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.username.localeCompare(b.username);
      if (sortBy === 'date') return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      return 0;
    });

  const handleBanUser = async (userId: string, username: string) => {
    await banUser(userId);
    addToLog('Banned user', username, 'ban');
    toast({ title: 'User Banned', description: `${username} has been banned.` });
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    await unbanUser(userId);
    addToLog('Unbanned user', username, 'unban');
    toast({ title: 'User Unbanned', description: `${username} has been unbanned.` });
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    await deleteUser(userId);
    addToLog('Deleted user', username, 'delete');
    toast({ title: 'User Deleted', description: `${username}'s account deleted.`, variant: 'destructive' });
  };

  const toggleGamesShutdown = async () => {
    await setGamesShutdown(!gamesShutdown);
    addToLog(gamesShutdown ? 'Enabled all games' : 'Disabled all games', 'System', 'system');
    toast({
      title: gamesShutdown ? 'Games Enabled' : 'Games Disabled',
      description: gamesShutdown ? 'All games are now available.' : 'All games have been shut down.',
    });
  };

  const handleBulkBan = async () => {
    for (const id of selectedUsers) {
      const u = allUsers.find(x => x.id === id);
      if (u && !bannedUsers.includes(id)) await banUser(id);
    }
    addToLog(`Bulk banned ${selectedUsers.size} users`, 'Multiple', 'ban');
    setSelectedUsers(new Set());
    toast({ title: 'Bulk Ban', description: `${selectedUsers.size} users have been banned.` });
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const stats = {
    totalUsers: allUsers.length,
    bannedUsers: bannedUsers.length,
    activeGames: gamesShutdown ? 0 : gameCount,
    totalScores: leaderboard.length,
  };

  const activeUsers = allUsers.length - bannedUsers.length;
  const banRate = allUsers.length > 0 ? ((bannedUsers.length / allUsers.length) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center">
                <Crown className="w-7 h-7 text-warning" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground text-sm">Welcome back, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-7 w-full max-w-3xl">
              <TabsTrigger value="overview" className="gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs">
                <PieChart className="w-3.5 h-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5" /> Users
              </TabsTrigger>
              <TabsTrigger value="games" className="gap-1.5 text-xs">
                <Gamepad2 className="w-3.5 h-3.5" /> Games
              </TabsTrigger>
              <TabsTrigger value="cms" className="gap-1.5 text-xs">
                <Megaphone className="w-3.5 h-3.5" /> CMS
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1.5 text-xs">
                <Server className="w-3.5 h-3.5" /> System
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5" /> Logs
              </TabsTrigger>
            </TabsList>

            {/* ═══ Analytics Tab ═══ */}
            <TabsContent value="analytics">
              <AdminAnalytics />
            </TabsContent>

            {/* ═══ CMS Tab ═══ */}
            <TabsContent value="cms">
              <AdminCMS />
            </TabsContent>

            {/* ═══ Overview Tab ═══ */}
            <TabsContent value="overview" className="space-y-6">
              <AdminStats
                totalUsers={stats.totalUsers}
                bannedUsers={stats.bannedUsers}
                activeGames={stats.activeGames}
                totalScores={stats.totalScores}
                totalCoinsInCirculation={totalCoins}
                totalGemsInCirculation={totalGems}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-success" />
                    <h3 className="font-display font-bold">Quick Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground text-sm">Active Users</span><span className="font-bold text-success">{activeUsers}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground text-sm">Ban Rate</span><span className="font-bold text-destructive">{banRate}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground text-sm">Avg Coins/User</span><span className="font-bold text-warning">{allUsers.length > 0 ? Math.round(totalCoins / allUsers.length).toLocaleString() : 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground text-sm">Total Games</span><span className="font-bold text-primary">{gameCount}</span></div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold">Platform Health</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Database', status: true },
                      { label: 'Auth System', status: true },
                      { label: 'Game Server', status: !gamesShutdown },
                      { label: 'Edge Functions', status: true },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">{s.label}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${s.status ? 'text-success' : 'text-destructive'}`}>
                          <span className={`w-2 h-2 rounded-full ${s.status ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                          {s.status ? 'OK' : 'Down'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-secondary" />
                    <h3 className="font-display font-bold">Recent Actions</h3>
                  </div>
                  {activityLog.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activityLog.slice(0, 5).map(log => (
                        <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${log.type === 'ban' ? 'bg-destructive' : log.type === 'unban' ? 'bg-success' : 'bg-primary'}`} />
                          <div>
                            <p className="text-xs font-medium">{log.action}</p>
                            <p className="text-[10px] text-muted-foreground">{log.target} • {log.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent actions</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={toggleGamesShutdown}>
                    {gamesShutdown ? <Power className="w-5 h-5 text-success" /> : <PowerOff className="w-5 h-5 text-destructive" />}
                    <span className="text-xs">{gamesShutdown ? 'Enable Games' : 'Disable Games'}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={handleRefresh}>
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <span className="text-xs">Refresh Data</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('users')}>
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="text-xs">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('logs')}>
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs">View Logs</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ═══ Users Tab ═══ */}
            <TabsContent value="users" className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={userFilter} onValueChange={(v: any) => setUserFilter(v)}>
                  <SelectTrigger className="w-32">
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-32">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUsers.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkBan}>
                    <Ban className="w-4 h-4 mr-1" />
                    Ban Selected ({selectedUsers.size})
                  </Button>
                )}
              </div>

              {/* User count */}
              <p className="text-sm text-muted-foreground">{filteredUsers.length} users found</p>

              {/* User Table */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 w-8">
                          <input type="checkbox" className="rounded" onChange={e => {
                            if (e.target.checked) setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                            else setSelectedUsers(new Set());
                          }} />
                        </th>
                        <th className="text-left py-3 px-4 font-display text-sm">User</th>
                        <th className="text-left py-3 px-4 font-display text-sm">Joined</th>
                        <th className="text-left py-3 px-4 font-display text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-display text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const isBanned = bannedUsers.includes(u.id);
                        const isCurrentUser = u.id === user?.id;
                        
                        return (
                          <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${selectedUsers.has(u.id) ? 'bg-primary/5' : ''}`}>
                            <td className="py-3 px-4">
                              {!isCurrentUser && (
                                <input type="checkbox" className="rounded" checked={selectedUsers.has(u.id)}
                                  onChange={() => toggleSelectUser(u.id)} />
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-9 h-9 rounded-full" />
                                <div>
                                  <p className="font-medium text-sm">{u.username}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{u.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(u.joinDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {isBanned ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive font-medium">Banned</span>
                              ) : u.isAdmin ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning font-medium">Admin</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success font-medium">Active</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                {!isCurrentUser && (
                                  <>
                                    <AdminUserActions
                                      userId={u.id}
                                      username={u.username}
                                      currentCoins={0}
                                      currentGems={0}
                                      onUpdate={handleRefresh}
                                    />
                                    {isBanned ? (
                                      <Button variant="ghost" size="sm" onClick={() => handleUnbanUser(u.id, u.username)} className="text-success hover:text-success h-8 px-2">
                                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Unban
                                      </Button>
                                    ) : (
                                      <Button variant="ghost" size="sm" onClick={() => handleBanUser(u.id, u.username)} className="text-warning hover:text-warning h-8 px-2">
                                        <UserX className="w-3.5 h-3.5 mr-1" /> Ban
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id, u.username)} className="text-destructive hover:text-destructive h-8 px-2">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                {isCurrentUser && <span className="text-xs text-muted-foreground">You</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ═══ Games Tab ═══ */}
            <TabsContent value="games" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" /> Game Controls
                  </h2>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {gamesShutdown ? <PowerOff className="w-6 h-6 text-destructive" /> : <Power className="w-6 h-6 text-success" />}
                      <div>
                        <p className="font-medium">Game Status</p>
                        <p className={`text-sm ${gamesShutdown ? 'text-destructive' : 'text-success'}`}>
                          {gamesShutdown ? 'OFFLINE' : 'ONLINE'} — {gamesShutdown ? 0 : gameCount} games
                        </p>
                      </div>
                    </div>
                    <Switch checked={!gamesShutdown} onCheckedChange={toggleGamesShutdown} />
                  </div>
                  {gamesShutdown && (
                    <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Maintenance Mode</span>
                      </div>
                      <Input
                        placeholder="Maintenance note (optional)..."
                        value={maintenanceNote}
                        onChange={e => setMaintenanceNote(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Game Stats
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Total Games</span>
                      <span className="font-bold text-primary">{gameCount}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Leaderboard Entries</span>
                      <span className="font-bold text-secondary">{leaderboard.length}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Categories</span>
                      <span className="font-bold text-warning">17</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">3D Games</span>
                      <span className="font-bold text-success">1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Economy Overview */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-warning" /> Economy Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-warning/5 border border-warning/20 text-center">
                    <p className="text-2xl font-bold text-warning">{totalCoins.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Coins in Circulation</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20 text-center">
                    <p className="text-2xl font-bold text-secondary">{totalGems.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Gems in Circulation</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">{allUsers.length > 0 ? Math.round(totalCoins / allUsers.length) : 0}</p>
                    <p className="text-xs text-muted-foreground">Avg Coins/User</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                    <p className="text-2xl font-bold text-success">{allUsers.length > 0 ? Math.round(totalGems / allUsers.length) : 0}</p>
                    <p className="text-xs text-muted-foreground">Avg Gems/User</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══ System Tab ═══ */}
            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Platform Status
                  </h2>
                  <div className="space-y-2">
                    {[
                      { label: 'Cloud Database', icon: Database, status: true },
                      { label: 'Auth System', icon: Lock, status: true },
                      { label: 'Game Server', icon: Server, status: !gamesShutdown },
                      { label: 'Edge Functions', icon: Cpu, status: true },
                      { label: 'File Storage', icon: HardDrive, status: true },
                      { label: 'CDN', icon: Globe, status: true },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="flex items-center gap-2 text-sm">
                          <s.icon className="w-4 h-4 text-muted-foreground" />
                          {s.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${s.status ? 'text-success' : 'text-destructive'}`}>
                          {s.status ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {s.status ? 'Healthy' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Auto Backup</p>
                        <p className="text-xs text-muted-foreground">Automatic daily database backups</p>
                      </div>
                      <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Email Notifications</p>
                        <p className="text-xs text-muted-foreground">Get alerts for critical events</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Disable all games for maintenance</p>
                      </div>
                      <Switch checked={gamesShutdown} onCheckedChange={toggleGamesShutdown} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" /> Security Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-primary">{allUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Total Accounts</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-destructive">{bannedUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Banned Accounts</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-warning">{banRate}%</p>
                    <p className="text-xs text-muted-foreground">Ban Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-success">RLS</p>
                    <p className="text-xs text-muted-foreground">Security Level</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══ Logs Tab ═══ */}
            <TabsContent value="logs" className="space-y-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Activity Log
                  </h2>
                  {activityLog.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setActivityLog([])}>Clear</Button>
                  )}
                </div>
                {activityLog.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {activityLog.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          log.type === 'ban' ? 'bg-destructive/20' : log.type === 'unban' ? 'bg-success/20' : log.type === 'delete' ? 'bg-destructive/20' : 'bg-primary/20'
                        }`}>
                          {log.type === 'ban' ? <Ban className="w-4 h-4 text-destructive" /> :
                           log.type === 'unban' ? <UserCheck className="w-4 h-4 text-success" /> :
                           log.type === 'delete' ? <Trash2 className="w-4 h-4 text-destructive" /> :
                           <Activity className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">Target: {log.target}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No activity yet. Actions you perform will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;

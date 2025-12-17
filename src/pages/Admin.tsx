import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Crown, Users, Gamepad2, AlertTriangle, Ban, Trash2, 
  Power, PowerOff, Search, Shield, UserX, UserCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

const Admin: React.FC = () => {
  const { 
    user, 
    isLoggedIn, 
    gamesShutdown, 
    setGamesShutdown, 
    bannedUsers, 
    banUser, 
    unbanUser, 
    deleteUser,
    leaderboard
  } = useGame();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    setAllUsers(users);
  }, []);

  if (!isLoggedIn || !user?.isAdmin) {
    return <Navigate to="/" />;
  }

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBanUser = (userId: string, username: string) => {
    banUser(userId);
    toast({
      title: 'User Banned',
      description: `${username} has been banned from the platform.`,
    });
  };

  const handleUnbanUser = (userId: string, username: string) => {
    unbanUser(userId);
    toast({
      title: 'User Unbanned',
      description: `${username} has been unbanned.`,
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    deleteUser(userId);
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: 'User Deleted',
      description: `${username}'s account has been permanently deleted.`,
      variant: 'destructive',
    });
  };

  const toggleGamesShutdown = () => {
    setGamesShutdown(!gamesShutdown);
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
    activeGames: gamesShutdown ? 0 : 4,
    totalScores: leaderboard.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-warning" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, games, and platform settings</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <Users className="w-6 h-6 text-primary mb-2" />
              <p className="text-2xl font-display font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <Ban className="w-6 h-6 text-destructive mb-2" />
              <p className="text-2xl font-display font-bold">{stats.bannedUsers}</p>
              <p className="text-sm text-muted-foreground">Banned Users</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <Gamepad2 className="w-6 h-6 text-success mb-2" />
              <p className="text-2xl font-display font-bold">{stats.activeGames}</p>
              <p className="text-sm text-muted-foreground">Active Games</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <Shield className="w-6 h-6 text-warning mb-2" />
              <p className="text-2xl font-display font-bold">{stats.totalScores}</p>
              <p className="text-sm text-muted-foreground">Leaderboard Entries</p>
            </div>
          </div>

          {/* Quick Actions */}
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
                  <span>Database</span>
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
                              <p className="text-xs text-muted-foreground">{u.id}</p>
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

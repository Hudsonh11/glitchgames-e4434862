import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { playSfx } from '@/lib/sfx';


interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  achievements: string[];
  friends: string[];
  gamesPlayed: number;
  totalScore: number;
  joinDate: string;
  lastLogin: string;
  isBanned: boolean;
  isAdmin: boolean;
}

interface GameStats {
  gameId: string;
  highScore: number;
  timePlayed: number;
  gamesPlayed: number;
}

interface DailyReward {
  day: number;
  coins: number;
  gems: number;
  claimed: boolean;
}

interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  gameId: string;
  isPlus?: boolean;
}


interface GameContextType {
  user: UserProfile | null;
  session: Session | null;
  setUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  coins: number;
  gems: number;
  addCoins: (amount: number) => Promise<void>;
  addGems: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  spendGems: (amount: number) => Promise<boolean>;
  
  soundSettings: SoundSettings;
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
  
  gameStats: Record<string, GameStats>;
  updateGameStats: (gameId: string, score: number, timePlayed: number) => Promise<void>;
  
  dailyRewards: DailyReward[];
  claimDailyReward: (day: number) => Promise<boolean>;
  currentStreak: number;
  lastClaimDate: string | null;
  
  leaderboard: LeaderboardEntry[];
  fetchLeaderboard: (gameId?: string) => Promise<void>;
  
  achievements: string[];
  unlockAchievement: (achievementId: string) => Promise<void>;
  
  gamesShutdown: boolean;
  setGamesShutdown: (shutdown: boolean) => Promise<void>;
  
  bannedUsers: string[];
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  
  allUsers: UserProfile[];
  fetchAllUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const defaultSoundSettings: SoundSettings = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 80,
  isMuted: false,
};

const defaultDailyRewards: DailyReward[] = [
  { day: 1, coins: 100, gems: 0, claimed: false },
  { day: 2, coins: 150, gems: 0, claimed: false },
  { day: 3, coins: 200, gems: 5, claimed: false },
  { day: 4, coins: 250, gems: 0, claimed: false },
  { day: 5, coins: 300, gems: 10, claimed: false },
  { day: 6, coins: 400, gems: 0, claimed: false },
  { day: 7, coins: 500, gems: 25, claimed: false },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(defaultSoundSettings);
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>(defaultDailyRewards);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [gamesShutdown, setGamesShutdownState] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Load sound settings from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem('soundSettings');
    if (savedSound) setSoundSettings(JSON.parse(savedSound));
  }, []);

  useEffect(() => {
    localStorage.setItem('soundSettings', JSON.stringify(soundSettings));
  }, [soundSettings]);

  // Initialize auth and fetch user data
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      
      if (newSession?.user) {
        setTimeout(() => {
          fetchUserProfile(newSession.user.id);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    fetchGameSettings();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        // Check if user is banned
        const { data: banData } = await supabase
          .from('banned_users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        // Fetch achievements
        const { data: achievementData } = await supabase
          .from('achievements')
          .select('achievement_id')
          .eq('user_id', userId);

        // Fetch game stats
        const { data: statsData } = await supabase
          .from('game_stats')
          .select('*')
          .eq('user_id', userId);

        // Fetch daily rewards
        const { data: rewardsData } = await supabase
          .from('daily_rewards')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const userProfile: UserProfile = {
          id: profile.user_id,
          username: profile.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          coins: profile.coins,
          gems: profile.gems,
          level: profile.level,
          xp: profile.xp,
          achievements: achievementData?.map(a => a.achievement_id) || [],
          friends: [],
          gamesPlayed: statsData?.reduce((sum, s) => sum + s.games_played, 0) || 0,
          totalScore: statsData?.reduce((sum, s) => sum + s.high_score, 0) || 0,
          joinDate: profile.created_at,
          lastLogin: new Date().toISOString(),
          isBanned: !!banData,
          isAdmin: !!roleData,
        };

        setUser(userProfile);
        setAchievements(userProfile.achievements);

        if (statsData) {
          const stats: Record<string, GameStats> = {};
          statsData.forEach(s => {
            stats[s.game_id] = {
              gameId: s.game_id,
              highScore: s.high_score,
              timePlayed: s.total_time_played,
              gamesPlayed: s.games_played,
            };
          });
          setGameStats(stats);
        }

        if (rewardsData) {
          setCurrentStreak(rewardsData.streak);
          setLastClaimDate(rewardsData.last_claim_date);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameSettings = async () => {
    const { data } = await supabase
      .from('game_settings')
      .select('*')
      .eq('key', 'games_shutdown')
      .maybeSingle();

    if (data) {
      setGamesShutdownState((data.value as { enabled: boolean }).enabled);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if user is banned
      const { data: banData } = await supabase
        .from('banned_users')
        .select('*')
        .eq('user_id', data.user?.id)
        .maybeSingle();

      if (banData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Your account has been banned.' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'Username already exists.' };
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const addCoins = async (amount: number) => {
    if (!user || !session) return;

    const newCoins = user.coins + amount;
    await supabase
      .from('profiles')
      .update({ coins: newCoins })
      .eq('user_id', user.id);

    setUser({ ...user, coins: newCoins });
    if (amount > 0) { try { playSfx('coin'); } catch {/* ignore */} }
  };

  const addGems = async (amount: number) => {
    if (!user || !session) return;

    const newGems = user.gems + amount;
    await supabase
      .from('profiles')
      .update({ gems: newGems })
      .eq('user_id', user.id);

    setUser({ ...user, gems: newGems });
    if (amount > 0) { try { playSfx('powerup'); } catch {/* ignore */} }
  };


  const spendCoins = async (amount: number): Promise<boolean> => {
    if (!user || user.coins < amount) return false;

    const newCoins = user.coins - amount;
    await supabase
      .from('profiles')
      .update({ coins: newCoins })
      .eq('user_id', user.id);

    setUser({ ...user, coins: newCoins });
    return true;
  };

  const spendGems = async (amount: number): Promise<boolean> => {
    if (!user || user.gems < amount) return false;

    const newGems = user.gems - amount;
    await supabase
      .from('profiles')
      .update({ gems: newGems })
      .eq('user_id', user.id);

    setUser({ ...user, gems: newGems });
    return true;
  };

  const updateSoundSettings = (settings: Partial<SoundSettings>) => {
    setSoundSettings({ ...soundSettings, ...settings });
  };

  const updateGameStats = async (gameId: string, score: number, timePlayed: number) => {
    if (!user || !session) return;

    const current = gameStats[gameId] || { gameId, highScore: 0, timePlayed: 0, gamesPlayed: 0 };
    const newStats = {
      highScore: Math.max(current.highScore, score),
      timePlayed: current.timePlayed + timePlayed,
      gamesPlayed: current.gamesPlayed + 1,
    };

    const { error } = await supabase
      .from('game_stats')
      .upsert({
        user_id: user.id,
        game_id: gameId,
        high_score: newStats.highScore,
        games_played: newStats.gamesPlayed,
        total_time_played: newStats.timePlayed,
      }, {
        onConflict: 'user_id,game_id',
      });

    if (!error) {
      setGameStats({
        ...gameStats,
        [gameId]: { ...current, ...newStats },
      });

      // Apply prestige XP multiplier if any
      let xpMult = 1;
      try {
        const { data: prestige } = await supabase
          .from('user_prestige')
          .select('xp_multiplier')
          .eq('user_id', user.id)
          .maybeSingle();
        if (prestige?.xp_multiplier) xpMult = Number(prestige.xp_multiplier);
      } catch { /* non-fatal */ }

      // Glitch Games Plus: 2× XP boost + 25% coin bonus on every win.
      let plusActive = false;
      try {
        const { data: plus } = await supabase
          .from('plus_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .limit(1)
          .maybeSingle();
        plusActive = !!plus;
      } catch { /* non-fatal */ }

      const plusMult = plusActive ? 2 : 1;

      // Update profile XP (with prestige + Plus bonus)
      const newXp = user.xp + Math.floor((score / 10) * xpMult * plusMult);
      await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('user_id', user.id);

      setUser({
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        totalScore: user.totalScore + score,
        xp: newXp,
      });

      // Plus 25% coin bonus on score-positive runs
      if (plusActive && score > 0) {
        const bonus = Math.max(1, Math.floor(score / 40)); // 25% of score/10
        await addCoins(bonus);
      }

      // Bump quest progress (non-blocking)
      const { bumpQuestProgress } = await import('@/lib/questProgress');
      bumpQuestProgress({ userId: user.id, score });
    }
  };

  // Generate infinite rewards based on day number
  const generateReward = (day: number) => {
    const cycle = Math.floor((day - 1) / 7);
    const dayInCycle = ((day - 1) % 7) + 1;
    
    const baseCoins = [100, 150, 200, 250, 300, 400, 500];
    const baseGems = [0, 0, 5, 0, 10, 0, 25];
    
    const multiplier = 1 + (cycle * 0.1);
    
    return {
      coins: Math.floor(baseCoins[dayInCycle - 1] * multiplier),
      gems: Math.floor(baseGems[dayInCycle - 1] * multiplier),
    };
  };

  const claimDailyReward = async (day: number): Promise<boolean> => {
    if (!user || !session) return false;

    const today = new Date().toISOString().split('T')[0];
    if (lastClaimDate === today) return false;

    // Generate reward for the specific day (endless system)
    const reward = generateReward(day);

    await addCoins(reward.coins);
    await addGems(reward.gems);

    const newStreak = day;
    await supabase
      .from('daily_rewards')
      .update({
        last_claim_date: today,
        streak: newStreak,
      })
      .eq('user_id', user.id);

    setLastClaimDate(today);
    setCurrentStreak(newStreak);

    return true;
  };

  const fetchLeaderboard = async (gameId?: string) => {
    try {
      // First fetch game stats
      let query = supabase
        .from('game_stats')
        .select('high_score, game_id, user_id')
        .order('high_score', { ascending: false })
        .limit(100);

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data: statsData, error: statsError } = await query;

      if (statsError || !statsData || statsData.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Then fetch profiles for those users
      const userIds = [...new Set(statsData.map(s => s.user_id))];
      const [{ data: profilesData }, { data: plusData }] = await Promise.all([
        supabase.from('profiles').select('user_id, username').in('user_id', userIds),
        supabase
          .from('plus_subscriptions')
          .select('user_id')
          .in('user_id', userIds)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString()),
      ]);

      const profileMap = new Map(
        (profilesData || []).map(p => [p.user_id, p.username])
      );
      const plusSet = new Set((plusData || []).map(p => p.user_id));

      const entries: LeaderboardEntry[] = statsData.map((item, index) => {
        const username = profileMap.get(item.user_id) || 'Unknown Player';
        return {
          rank: index + 1,
          userId: item.user_id,
          username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          score: item.high_score,
          gameId: item.game_id,
          isPlus: plusSet.has(item.user_id),
        };
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    if (!user || !session || achievements.includes(achievementId)) return;

    await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        achievement_id: achievementId,
      });

    setAchievements([...achievements, achievementId]);
    try { playSfx('levelup'); } catch {/* ignore */}
    await addCoins(100);
    await addGems(10);
  };


  const setGamesShutdown = async (shutdown: boolean) => {
    if (!user?.isAdmin) return;

    await supabase
      .from('game_settings')
      .update({ value: { enabled: shutdown } })
      .eq('key', 'games_shutdown');

    setGamesShutdownState(shutdown);
  };

  const banUser = async (userId: string) => {
    if (!user?.isAdmin) return;

    await supabase
      .from('banned_users')
      .insert({ user_id: userId });

    setBannedUsers([...bannedUsers, userId]);
  };

  const unbanUser = async (userId: string) => {
    if (!user?.isAdmin) return;

    await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', userId);

    setBannedUsers(bannedUsers.filter(id => id !== userId));
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*');

    if (data) {
      const { data: bannedData } = await supabase
        .from('banned_users')
        .select('user_id');

      const bannedIds = bannedData?.map(b => b.user_id) || [];
      setBannedUsers(bannedIds);

      const profiles: UserProfile[] = data.map(p => ({
        id: p.user_id,
        username: p.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
        coins: p.coins,
        gems: p.gems,
        level: p.level,
        xp: p.xp,
        achievements: [],
        friends: [],
        gamesPlayed: 0,
        totalScore: 0,
        joinDate: p.created_at,
        lastLogin: p.updated_at,
        isBanned: bannedIds.includes(p.user_id),
        isAdmin: false,
      }));
      setAllUsers(profiles);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user?.isAdmin) return;

    // This will cascade delete due to foreign key constraints
    await supabase.auth.admin.deleteUser(userId);
    setAllUsers(allUsers.filter(u => u.id !== userId));
  };

  return (
    <GameContext.Provider value={{
      user,
      session,
      setUser,
      isLoggedIn: !!user && !!session,
      isLoading,
      login,
      logout,
      register,
      coins: user?.coins || 0,
      gems: user?.gems || 0,
      addCoins,
      addGems,
      spendCoins,
      spendGems,
      soundSettings,
      updateSoundSettings,
      gameStats,
      updateGameStats,
      dailyRewards,
      claimDailyReward,
      currentStreak,
      lastClaimDate,
      leaderboard,
      fetchLeaderboard,
      achievements,
      unlockAchievement,
      gamesShutdown,
      setGamesShutdown,
      bannedUsers,
      banUser,
      unbanUser,
      allUsers,
      fetchAllUsers,
      deleteUser,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

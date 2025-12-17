import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  username: string;
  avatar: string;
  score: number;
  gameId: string;
}

interface GameContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string) => boolean;
  
  coins: number;
  gems: number;
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  spendGems: (amount: number) => boolean;
  
  soundSettings: SoundSettings;
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
  
  gameStats: Record<string, GameStats>;
  updateGameStats: (gameId: string, score: number, timePlayed: number) => void;
  
  dailyRewards: DailyReward[];
  claimDailyReward: (day: number) => boolean;
  currentStreak: number;
  lastClaimDate: string | null;
  
  leaderboard: LeaderboardEntry[];
  updateLeaderboard: (gameId: string, score: number) => void;
  
  achievements: string[];
  unlockAchievement: (achievementId: string) => void;
  
  gamesShutdown: boolean;
  setGamesShutdown: (shutdown: boolean) => void;
  
  bannedUsers: string[];
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  
  allUsers: UserProfile[];
  deleteUser: (userId: string) => void;
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
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(defaultSoundSettings);
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>(defaultDailyRewards);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [gamesShutdown, setGamesShutdown] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('gameUser');
    const savedSound = localStorage.getItem('soundSettings');
    const savedStats = localStorage.getItem('gameStats');
    const savedRewards = localStorage.getItem('dailyRewards');
    const savedStreak = localStorage.getItem('currentStreak');
    const savedLastClaim = localStorage.getItem('lastClaimDate');
    const savedLeaderboard = localStorage.getItem('leaderboard');
    const savedAchievements = localStorage.getItem('achievements');
    const savedShutdown = localStorage.getItem('gamesShutdown');
    const savedBanned = localStorage.getItem('bannedUsers');
    const savedAllUsers = localStorage.getItem('allUsers');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedSound) setSoundSettings(JSON.parse(savedSound));
    if (savedStats) setGameStats(JSON.parse(savedStats));
    if (savedRewards) setDailyRewards(JSON.parse(savedRewards));
    if (savedStreak) setCurrentStreak(JSON.parse(savedStreak));
    if (savedLastClaim) setLastClaimDate(savedLastClaim);
    if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
    if (savedShutdown) setGamesShutdown(JSON.parse(savedShutdown));
    if (savedBanned) setBannedUsers(JSON.parse(savedBanned));
    if (savedAllUsers) setAllUsers(JSON.parse(savedAllUsers));
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (user) localStorage.setItem('gameUser', JSON.stringify(user));
    else localStorage.removeItem('gameUser');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('soundSettings', JSON.stringify(soundSettings));
  }, [soundSettings]);

  useEffect(() => {
    localStorage.setItem('gameStats', JSON.stringify(gameStats));
  }, [gameStats]);

  useEffect(() => {
    localStorage.setItem('dailyRewards', JSON.stringify(dailyRewards));
  }, [dailyRewards]);

  useEffect(() => {
    localStorage.setItem('currentStreak', JSON.stringify(currentStreak));
  }, [currentStreak]);

  useEffect(() => {
    if (lastClaimDate) localStorage.setItem('lastClaimDate', lastClaimDate);
  }, [lastClaimDate]);

  useEffect(() => {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('gamesShutdown', JSON.stringify(gamesShutdown));
  }, [gamesShutdown]);

  useEffect(() => {
    localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
  }, [bannedUsers]);

  useEffect(() => {
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
  }, [allUsers]);

  const login = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const foundUser = users.find((u: any) => u.username === username && u.password === password);
    
    if (foundUser) {
      if (bannedUsers.includes(foundUser.id)) {
        return false;
      }
      const profile: UserProfile = {
        id: foundUser.id,
        username: foundUser.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        coins: foundUser.coins || 1000,
        gems: foundUser.gems || 50,
        level: foundUser.level || 1,
        xp: foundUser.xp || 0,
        achievements: foundUser.achievements || [],
        friends: foundUser.friends || [],
        gamesPlayed: foundUser.gamesPlayed || 0,
        totalScore: foundUser.totalScore || 0,
        joinDate: foundUser.joinDate || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isBanned: bannedUsers.includes(foundUser.id),
        isAdmin: foundUser.isAdmin || username === 'admin',
      };
      setUser(profile);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const register = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (users.find((u: any) => u.username === username)) {
      return false;
    }
    
    const newUser = {
      id: `user_${Date.now()}`,
      username,
      password,
      coins: 1000,
      gems: 50,
      level: 1,
      xp: 0,
      achievements: [],
      friends: [],
      gamesPlayed: 0,
      totalScore: 0,
      joinDate: new Date().toISOString(),
      isAdmin: username === 'admin',
    };
    
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    const profile: UserProfile = {
      ...newUser,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      lastLogin: new Date().toISOString(),
      isBanned: false,
    };
    setUser(profile);
    setAllUsers([...allUsers, profile]);
    return true;
  };

  const addCoins = (amount: number) => {
    if (user) {
      setUser({ ...user, coins: user.coins + amount });
    }
  };

  const addGems = (amount: number) => {
    if (user) {
      setUser({ ...user, gems: user.gems + amount });
    }
  };

  const spendCoins = (amount: number): boolean => {
    if (user && user.coins >= amount) {
      setUser({ ...user, coins: user.coins - amount });
      return true;
    }
    return false;
  };

  const spendGems = (amount: number): boolean => {
    if (user && user.gems >= amount) {
      setUser({ ...user, gems: user.gems - amount });
      return true;
    }
    return false;
  };

  const updateSoundSettings = (settings: Partial<SoundSettings>) => {
    setSoundSettings({ ...soundSettings, ...settings });
  };

  const updateGameStats = (gameId: string, score: number, timePlayed: number) => {
    const current = gameStats[gameId] || { gameId, highScore: 0, timePlayed: 0, gamesPlayed: 0 };
    setGameStats({
      ...gameStats,
      [gameId]: {
        ...current,
        highScore: Math.max(current.highScore, score),
        timePlayed: current.timePlayed + timePlayed,
        gamesPlayed: current.gamesPlayed + 1,
      },
    });
    
    if (user) {
      setUser({
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        totalScore: user.totalScore + score,
        xp: user.xp + Math.floor(score / 10),
      });
    }
    
    updateLeaderboard(gameId, score);
  };

  const claimDailyReward = (day: number): boolean => {
    const today = new Date().toDateString();
    if (lastClaimDate === today) return false;
    
    const reward = dailyRewards.find(r => r.day === day);
    if (!reward || reward.claimed) return false;
    
    addCoins(reward.coins);
    addGems(reward.gems);
    
    setDailyRewards(dailyRewards.map(r => 
      r.day === day ? { ...r, claimed: true } : r
    ));
    
    setLastClaimDate(today);
    setCurrentStreak(day);
    
    return true;
  };

  const updateLeaderboard = (gameId: string, score: number) => {
    if (!user) return;
    
    const entry: LeaderboardEntry = {
      rank: 0,
      username: user.username,
      avatar: user.avatar,
      score,
      gameId,
    };
    
    const gameLeaderboard = leaderboard.filter(e => e.gameId === gameId);
    const existingIndex = gameLeaderboard.findIndex(e => e.username === user.username);
    
    if (existingIndex >= 0) {
      if (gameLeaderboard[existingIndex].score < score) {
        gameLeaderboard[existingIndex].score = score;
      }
    } else {
      gameLeaderboard.push(entry);
    }
    
    gameLeaderboard.sort((a, b) => b.score - a.score);
    gameLeaderboard.forEach((e, i) => e.rank = i + 1);
    
    const otherEntries = leaderboard.filter(e => e.gameId !== gameId);
    setLeaderboard([...otherEntries, ...gameLeaderboard]);
  };

  const unlockAchievement = (achievementId: string) => {
    if (!achievements.includes(achievementId)) {
      setAchievements([...achievements, achievementId]);
      addCoins(100);
      addGems(10);
    }
  };

  const banUser = (userId: string) => {
    if (!bannedUsers.includes(userId)) {
      setBannedUsers([...bannedUsers, userId]);
    }
  };

  const unbanUser = (userId: string) => {
    setBannedUsers(bannedUsers.filter(id => id !== userId));
  };

  const deleteUser = (userId: string) => {
    setAllUsers(allUsers.filter(u => u.id !== userId));
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const filtered = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('registeredUsers', JSON.stringify(filtered));
  };

  return (
    <GameContext.Provider value={{
      user,
      setUser,
      isLoggedIn: !!user,
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
      updateLeaderboard,
      achievements,
      unlockAchievement,
      gamesShutdown,
      setGamesShutdown,
      bannedUsers,
      banUser,
      unbanUser,
      allUsers,
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

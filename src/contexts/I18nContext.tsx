// Lightweight i18n. No external dependency — a small Context that reads the
// 'language' setting from localStorage and exposes a t() lookup.
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type Lang = 'en' | 'es' | 'fr' | 'de' | 'ja';

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: {
    'nav.home': 'Home',
    'nav.leaderboard': 'Leaderboard',
    'nav.rewards': 'Rewards',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'nav.signIn': 'Sign in',
    'common.play': 'Play',
    'common.loading': 'Loading…',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.close': 'Close',
    'common.coins': 'Coins',
    'common.gems': 'Gems',
    'common.level': 'Level',
    'common.streak': 'Streak',
    'rewards.claim': 'Claim',
    'rewards.claimed': 'Claimed',
    'quests.daily': 'Daily Quests',
    'quests.weekly': 'Weekly Quests',
    'quests.seasonal': 'Seasonal Quests',
    'quests.complete': 'Complete',
    'prestige.title': 'Prestige',
    'prestige.description': 'Reset your level for permanent bonuses',
    'prestige.button': 'Prestige Now',
  },
  es: {
    'nav.home': 'Inicio', 'nav.leaderboard': 'Clasificación', 'nav.rewards': 'Recompensas',
    'nav.profile': 'Perfil', 'nav.settings': 'Ajustes', 'nav.signOut': 'Cerrar sesión',
    'nav.signIn': 'Iniciar sesión',
    'common.play': 'Jugar', 'common.loading': 'Cargando…', 'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar', 'common.save': 'Guardar', 'common.delete': 'Eliminar',
    'common.search': 'Buscar', 'common.close': 'Cerrar', 'common.coins': 'Monedas',
    'common.gems': 'Gemas', 'common.level': 'Nivel', 'common.streak': 'Racha',
    'rewards.claim': 'Reclamar', 'rewards.claimed': 'Reclamado',
    'quests.daily': 'Misiones diarias', 'quests.weekly': 'Misiones semanales',
    'quests.seasonal': 'Misiones de temporada', 'quests.complete': 'Completar',
    'prestige.title': 'Prestigio', 'prestige.description': 'Reinicia tu nivel por bonos permanentes',
    'prestige.button': 'Prestigiar ahora',
  },
  fr: {
    'nav.home': 'Accueil', 'nav.leaderboard': 'Classement', 'nav.rewards': 'Récompenses',
    'nav.profile': 'Profil', 'nav.settings': 'Paramètres', 'nav.signOut': 'Se déconnecter',
    'nav.signIn': 'Se connecter',
    'common.play': 'Jouer', 'common.loading': 'Chargement…', 'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer', 'common.save': 'Enregistrer', 'common.delete': 'Supprimer',
    'common.search': 'Rechercher', 'common.close': 'Fermer', 'common.coins': 'Pièces',
    'common.gems': 'Gemmes', 'common.level': 'Niveau', 'common.streak': 'Série',
    'rewards.claim': 'Réclamer', 'rewards.claimed': 'Réclamé',
    'quests.daily': 'Quêtes quotidiennes', 'quests.weekly': 'Quêtes hebdomadaires',
    'quests.seasonal': 'Quêtes saisonnières', 'quests.complete': 'Terminer',
    'prestige.title': 'Prestige', 'prestige.description': 'Réinitialisez pour des bonus permanents',
    'prestige.button': 'Prestige maintenant',
  },
  de: {
    'nav.home': 'Start', 'nav.leaderboard': 'Bestenliste', 'nav.rewards': 'Belohnungen',
    'nav.profile': 'Profil', 'nav.settings': 'Einstellungen', 'nav.signOut': 'Abmelden',
    'nav.signIn': 'Anmelden',
    'common.play': 'Spielen', 'common.loading': 'Lädt…', 'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen', 'common.save': 'Speichern', 'common.delete': 'Löschen',
    'common.search': 'Suchen', 'common.close': 'Schließen', 'common.coins': 'Münzen',
    'common.gems': 'Edelsteine', 'common.level': 'Stufe', 'common.streak': 'Serie',
    'rewards.claim': 'Einlösen', 'rewards.claimed': 'Eingelöst',
    'quests.daily': 'Tägliche Quests', 'quests.weekly': 'Wöchentliche Quests',
    'quests.seasonal': 'Saison-Quests', 'quests.complete': 'Abschließen',
    'prestige.title': 'Prestige', 'prestige.description': 'Stufe für dauerhafte Boni zurücksetzen',
    'prestige.button': 'Prestige jetzt',
  },
  ja: {
    'nav.home': 'ホーム', 'nav.leaderboard': 'ランキング', 'nav.rewards': '報酬',
    'nav.profile': 'プロフィール', 'nav.settings': '設定', 'nav.signOut': 'サインアウト',
    'nav.signIn': 'サインイン',
    'common.play': 'プレイ', 'common.loading': '読み込み中…', 'common.cancel': 'キャンセル',
    'common.confirm': '確認', 'common.save': '保存', 'common.delete': '削除',
    'common.search': '検索', 'common.close': '閉じる', 'common.coins': 'コイン',
    'common.gems': 'ジェム', 'common.level': 'レベル', 'common.streak': '連続',
    'rewards.claim': '受け取る', 'rewards.claimed': '受領済み',
    'quests.daily': 'デイリークエスト', 'quests.weekly': 'ウィークリークエスト',
    'quests.seasonal': 'シーズンクエスト', 'quests.complete': '完了',
    'prestige.title': 'プレステージ', 'prestige.description': 'リセットして永続ボーナスを獲得',
    'prestige.button': 'プレステージする',
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

const readLang = (): Lang => {
  const v = (localStorage.getItem('language') || 'en') as Lang;
  return DICTS[v] ? v : 'en';
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'language') setLangState(readLang());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<I18nCtx>(() => ({
    lang,
    setLang: (l) => { localStorage.setItem('language', l); setLangState(l); document.documentElement.lang = l; },
    t: (key) => DICTS[lang][key] || DICTS.en[key] || key,
  }), [lang]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = (): I18nCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used inside I18nProvider');
  return c;
};

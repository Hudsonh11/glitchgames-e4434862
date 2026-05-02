import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ClansHub from '@/components/ClansHub';
import FollowersPanel from '@/components/FollowersPanel';
import PartyLobbies from '@/components/PartyLobbies';
import TournamentsPanel from '@/components/TournamentsPanel';
import { Users, Shield, Trophy, UserPlus } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Navigate } from 'react-router-dom';

const Social: React.FC = () => {
  const { isLoggedIn, isLoading } = useGame();
  if (isLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Social Hub
        </h1>
        <p className="text-muted-foreground mb-6">Clans, followers, parties, and tournaments</p>
        <Tabs defaultValue="clans">
          <TabsList className="mb-6">
            <TabsTrigger value="clans" className="gap-2"><Shield className="w-4 h-4" />Clans</TabsTrigger>
            <TabsTrigger value="followers" className="gap-2"><UserPlus className="w-4 h-4" />Followers</TabsTrigger>
            <TabsTrigger value="parties" className="gap-2"><Users className="w-4 h-4" />Parties</TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2"><Trophy className="w-4 h-4" />Tournaments</TabsTrigger>
          </TabsList>
          <TabsContent value="clans"><ClansHub /></TabsContent>
          <TabsContent value="followers"><FollowersPanel /></TabsContent>
          <TabsContent value="parties"><PartyLobbies /></TabsContent>
          <TabsContent value="tournaments"><TournamentsPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;

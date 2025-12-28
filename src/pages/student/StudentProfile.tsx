import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit2, Save, X, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { currentStudent } from '@/data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nickname: currentStudent.nickname,
    bio: currentStudent.bio,
  });

  const handleSave = () => {
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfile({
      nickname: currentStudent.nickname,
      bio: currentStudent.bio,
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your account settings and preferences</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-accent">
                    <AvatarImage src={currentStudent.avatar} />
                    <AvatarFallback className="text-3xl sm:text-4xl">{currentStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <Badge variant={currentStudent.level.toLowerCase() as any} className="text-sm sm:text-base px-3 sm:px-4 py-1">
                  Level {currentStudent.level}
                </Badge>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{currentStudent.name}</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">{currentStudent.email}</p>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 w-full sm:w-auto">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" onClick={handleCancel} className="gap-2 flex-1 sm:flex-none">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} className="gap-2 flex-1 sm:flex-none">
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        value={profile.nickname}
                        onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                        placeholder="Your nickname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nickname</p>
                      <p className="text-foreground font-medium">@{profile.nickname}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="text-foreground">{profile.bio || 'No bio yet'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-primary">{currentStudent.totalSessions}</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-accent">{currentStudent.hoursLearned}h</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-success">7</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Streak 🔥</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-foreground font-medium">
                  {format(new Date(currentStudent.joinedAt), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Level</p>
                <p className="text-foreground font-medium">{currentStudent.level} - Intermediate</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{currentStudent.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

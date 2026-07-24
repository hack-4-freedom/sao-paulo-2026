export type Trilha = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_emoji: string;
  color_hex: string;
  position: number;
};

export type StoryFrame = {
  scene: string;
  emoji: string;
  narrator: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  trilha_id: string;
  slug: string;
  title: string;
  subtitle: string;
  cover_emoji: string;
  position: number;
  duration_min: number;
  reward_sats: number;
  reward_xp: number;
  story_frames: StoryFrame[];
  quiz: QuizQuestion[];
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  status: "in_progress" | "completed";
  quiz_correct: number;
  quiz_total: number;
  sats_earned: number;
  xp_earned: number;
  completed_at: string | null;
};

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  avatar_emoji: string;
  avatar_url: string | null;
  banner_color: string;
  streak_days: number;
  last_active_date: string | null;
  xp_total: number;
  level: number;
  weekly_xp: number;
  league: string | null;
  onboarding_completed: boolean;
  birthdate: string | null;
  bio: string;
  city: string | null;
  country: string | null;
  school: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  friend_code: string | null;
  is_supporter: boolean;
  supporter_title: string | null;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance_sats: number;
  lifetime_sats: number;
};

export type WalletTx = {
  id: string;
  user_id: string;
  wallet_id: string;
  type:
    | "learning_reward"
    | "mission_reward"
    | "game_reward"
    | "referral_reward"
    | "withdrawal"
    | "adjustment";
  amount_sats: number;
  label: string;
  ref_id: string | null;
  created_at: string;
};

export type Mission = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_emoji: string;
  target_count: number;
  reward_sats: number;
  reward_xp: number;
};

export type MissionProgress = {
  id: string;
  user_id: string;
  mission_id: string;
  period_date: string;
  current_count: number;
  completed: boolean;
  reward_claimed: boolean;
};

export type Badge = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_emoji: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
};

export type LessonWithProgress = Lesson & {
  progress?: LessonProgress;
};

export type MissionWithProgress = Mission & {
  progress?: MissionProgress;
};

export type Module = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon_emoji: string;
  color_hex: string;
  difficulty: string;
  position: number;
  trilha_id: string | null;
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_emoji: string;
  color_hex: string;
  reward_sats: number;
  reward_xp: number;
};

export type GameScore = {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  sats_earned: number;
  xp_earned: number;
  created_at: string;
};

export type GameSeason = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type GameSeasonRanking = {
  id: string;
  user_id: string;
  season_id: string;
  total_score: number;
  total_sats: number;
  rank: number | null;
};

export type Chest = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  min_level: number;
  min_sats: number;
  max_sats: number;
};

export type Collectible = {
  id: string;
  slug: string;
  name: string;
  type: "avatar" | "skin" | "title" | "badge";
  icon_emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
};

export type Invite = {
  id: string;
  user_id: string;
  code: string;
  used_by: string | null;
  reward_sats: number;
  created_at: string;
};

export type OpenFinanceAccount = {
  id: string;
  user_id: string;
  balance_brl: number;
  is_enabled: boolean;
  can_withdraw: boolean;
  can_request_card: boolean;
  institution: string | null;
};

export type VirtualCard = {
  id: string;
  user_id: string;
  of_account_id: string;
  last4: string;
  is_active: boolean;
  monthly_limit_brl: number;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
};

export type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type Supporter = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  level: number;
  started_at: string;
  children_impacted: number;
  hours_sponsored: number;
  total_sats: number;
  medals: string[];
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Donation = {
  id: string;
  user_id: string;
  amount_sats: number;
  message: string | null;
  anonymous: boolean;
  created_at: string;
};

export type Partner = {
  id: string;
  name: string;
  type: "ong" | "instituicao" | "escola" | "abrigo" | "empresa" | "universidade";
  logo_url: string | null;
  description: string;
  website_url: string | null;
  is_verified: boolean;
  documents: string[];
  created_at: string;
};

export type ImpactStory = {
  id: string;
  title: string;
  content: string;
  author_name: string | null;
  author_age: number | null;
  author_city: string | null;
  is_anonymized: boolean;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type CommunityWallPost = {
  id: string;
  user_id: string;
  type: "message" | "gratitude" | "achievement" | "event";
  content: string;
  created_at: string;
};

export type TransparencyStats = {
  total_sats_raised: number;
  total_supporters: number;
  total_youth_impacted: number;
  total_hours_sponsored: number;
  total_projects_funded: number;
};

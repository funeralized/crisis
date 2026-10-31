import React from 'react';
import {
  Car,
  Home,
  Briefcase,
  Plane,
  Smartphone,
  Laptop,
  GraduationCap,
  Target,
  Wallet,
  Package,
  Gamepad2,
  Camera,
  Shield,
  Trophy,
  TrendingUp,
  Landmark,
  Utensils,
  ShoppingBag,
  Sparkles,
  Layers,
} from 'lucide-react';

export const ICON_OPTIONS = [
  { id: 'target', label: 'Target', icon: Target },
  { id: 'car', label: 'Vehicle', icon: Car },
  { id: 'home', label: 'Housing', icon: Home },
  { id: 'briefcase', label: 'Business', icon: Briefcase },
  { id: 'plane', label: 'Travel', icon: Plane },
  { id: 'smartphone', label: 'Device', icon: Smartphone },
  { id: 'laptop', label: 'Tech', icon: Laptop },
  { id: 'graduation-cap', label: 'Education', icon: GraduationCap },
  { id: 'wallet', label: 'Savings', icon: Wallet },
  { id: 'package', label: 'Purchase', icon: Package },
  { id: 'gamepad', label: 'Gaming', icon: Gamepad2 },
  { id: 'camera', label: 'Creative', icon: Camera },
  { id: 'shield', label: 'Emergency', icon: Shield },
  { id: 'trophy', label: 'Milestone', icon: Trophy },
  { id: 'trending-up', label: 'Investment', icon: TrendingUp },
  { id: 'landmark', label: 'Bank', icon: Landmark },
  { id: 'utensils', label: 'Dining', icon: Utensils },
  { id: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { id: 'sparkles', label: 'Personal', icon: Sparkles },
  { id: 'layers', label: 'Services', icon: Layers },
];

const EMOJI_TO_ID: Record<string, string> = {
  '🚗': 'car',
  '🏠': 'home',
  '💼': 'briefcase',
  '✈️': 'plane',
  '📱': 'smartphone',
  '💻': 'laptop',
  '🎓': 'graduation-cap',
  '🎯': 'target',
  '💰': 'wallet',
  '📦': 'package',
  '🎮': 'gamepad',
  '📸': 'camera',
  '🚌': 'car',
  '💇': 'sparkles',
  '🍕': 'utensils',
  '🎬': 'entertainment',
  '🛍️': 'shopping-bag',
  '📚': 'graduation-cap',
};

const CATEGORY_TO_ID: Record<string, string> = {
  transportation: 'car',
  'personal care': 'sparkles',
  subscriptions: 'layers',
  food: 'utensils',
  entertainment: 'gamepad',
  shopping: 'shopping-bag',
  education: 'graduation-cap',
  business: 'briefcase',
  housing: 'home',
  health: 'shield',
  employment: 'wallet',
  freelance: 'laptop',
  'game development': 'gamepad',
  'roblox revenue': 'gamepad',
  investments: 'trending-up',
  'other income': 'wallet',
};

export function renderAppIcon(iconOrCategory: string | undefined, className = 'w-4 h-4'): React.ReactNode {
  if (!iconOrCategory) return <Target className={className} />;

  const key = iconOrCategory.trim();
  const idFromEmoji = EMOJI_TO_ID[key];
  const normalizedKey = (idFromEmoji || key).toLowerCase();

  const id = CATEGORY_TO_ID[normalizedKey] || normalizedKey;

  switch (id) {
    case 'car':
      return <Car className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'plane':
      return <Plane className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'laptop':
      return <Laptop className={className} />;
    case 'graduation-cap':
    case 'education':
      return <GraduationCap className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'gamepad':
    case 'gaming':
    case 'entertainment':
      return <Gamepad2 className={className} />;
    case 'camera':
      return <Camera className={className} />;
    case 'shield':
    case 'health':
      return <Shield className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'trending-up':
      return <TrendingUp className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'utensils':
    case 'food':
      return <Utensils className={className} />;
    case 'shopping-bag':
    case 'shopping':
      return <ShoppingBag className={className} />;
    case 'sparkles':
    case 'personal care':
      return <Sparkles className={className} />;
    case 'layers':
    case 'subscriptions':
      return <Layers className={className} />;
    case 'target':
    default:
      return <Target className={className} />;
  }
}

import type { LucideIcon } from 'lucide-react';
import {
  Briefcase, Car, Leaf, Gamepad2, Dumbbell, Moon, Users, Home,
} from 'lucide-react';
import type { BlockType, TaskCat, Prio } from '../types';

export const BLOCK_META: Record<BlockType, { label: string; color: string; soft: string; Icon: LucideIcon }> = {
  work:    { label: 'عمل',      color: '#2f2f2a', soft: '#e4e0d3', Icon: Briefcase },
  commute: { label: 'طريق',     color: '#c9962e', soft: '#f6e8c0', Icon: Car },
  relax:   { label: 'استرخاء',  color: '#6f9a55', soft: '#e3ecd6', Icon: Leaf },
  play:    { label: 'لعب',      color: '#8a6fd0', soft: '#e8e1f5', Icon: Gamepad2 },
  sport:   { label: 'رياضة',    color: '#cf6a56', soft: '#f6e0d9', Icon: Dumbbell },
  sleep:   { label: 'نوم',      color: '#7d8697', soft: '#e2e5ea', Icon: Moon },
  family:  { label: 'عائلة',    color: '#c2679b', soft: '#f3dfea', Icon: Users },
};

export const CAT_META: Record<TaskCat, { label: string; color: string; soft: string; Icon: LucideIcon }> = {
  work:  { label: 'شغل',      color: '#2f2f2a', soft: '#e4e0d3', Icon: Briefcase },
  life:  { label: 'حياة',     color: '#c2679b', soft: '#f3dfea', Icon: Home },
  relax: { label: 'استرخاء',  color: '#6f9a55', soft: '#e3ecd6', Icon: Leaf },
  play:  { label: 'لعب',      color: '#8a6fd0', soft: '#e8e1f5', Icon: Gamepad2 },
};

export const PRIO_META: Record<Prio, { label: string; dot: string }> = {
  high: { label: 'عاجل',   dot: '#d9534f' },
  med:  { label: 'عادي',   dot: '#eec643' },
  low:  { label: 'لاحقاً', dot: '#6f9a55' },
};

export const PRIO_ORDER: Record<Prio, number> = { high: 0, med: 1, low: 2 };

import type { LandingIconName } from "@/lib/landing";
import {
  BookOpen,
  Bot,
  Building2,
  ChartNoAxesColumn,
  Check,
  CircleDot,
  Code,
  FlaskConical,
  GitPullRequest,
  GraduationCap,
  HistoryIcon,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  SquareTerminal,
  Users,
  Zap,
} from "@peasant-labs/fairtrade/icons";
import type { ComponentType, SVGProps } from "react";

/* the landing names its pictures in words; this is the one place each word becomes a lucide mark */
const ICONS: Record<LandingIconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  check: Check,
  chart: ChartNoAxesColumn,
  class: GraduationCap,
  "pull-request": GitPullRequest,
  history: HistoryIcon,
  conversation: MessageCircle,
  search: Search,
  link: LinkIcon,
  send: Send,
  lock: Lock,
  code: Code,
  research: FlaskConical,
  team: Users,
  terminal: SquareTerminal,
  company: Building2,
  record: CircleDot,
  review: ShieldCheck,
  bot: Bot,
  zap: Zap,
  book: BookOpen,
};

/** A landing icon, decorative: the words beside it carry the meaning. */
export function LandingIcon({ name, className }: { name: LandingIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" focusable="false" />;
}

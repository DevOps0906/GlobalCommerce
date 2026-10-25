import {
  Activity,
  CreditCard,
  FileText,
  Globe,
  House,
  Menu,
  Package,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Upload,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// `@gc/domain` nav 의 icon(Lucide kebab-case 이름) → 컴포넌트. 필요한 아이콘만 가져와 번들을 줄인다.
const ICONS: Record<string, LucideIcon> = {
  house: House,
  globe: Globe,
  package: Package,
  upload: Upload,
  "file-text": FileText,
  smartphone: Smartphone,
  "share-2": Share2,
  workflow: Workflow,
  activity: Activity,
  search: Search,
  "sliders-horizontal": SlidersHorizontal,
  "credit-card": CreditCard,
  "shield-check": ShieldCheck,
  menu: Menu,
};

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Menu;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.75} className="shrink-0" />;
}

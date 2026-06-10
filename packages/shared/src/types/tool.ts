export interface CheckerTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  badgeColor?: string;
  category: "proxy" | "fingerprint" | "checkout" | "account";
  color: string;
  status: "active" | "inactive";
  url: string;
}
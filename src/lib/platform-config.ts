const LS_KEY = "finroute-platform-config-v1";

export interface PlatformConfig {
  maintenanceMode: boolean;
  bannerMessage: string;
  announcementEnabled: boolean;
  platformName: string;
  supportEmail: string;
  salesEmail: string;
  supportMobile: string;
  supportWhatsapp: string;
  twitterUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  officeAddress: string;
  businessHours: string;
  theme: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  bannerMessage: "🎉 Launch Offer: Upgrade your lending business to Guest Premium today!",
  announcementEnabled: true,
  platformName: "FinRoute",
  supportEmail: "support@digitalcore.co.in",
  salesEmail: "sales@finroute.in",
  supportMobile: "+91 80 4700 1200",
  supportWhatsapp: "+91 98765 43210",
  twitterUrl: "https://twitter.com/finroute",
  linkedinUrl: "https://linkedin.com/company/finroute",
  facebookUrl: "https://facebook.com/finroute",
  youtubeUrl: "https://youtube.com/@finroute",
  instagramUrl: "https://instagram.com/finroute.in",
  officeAddress: "H-24, FinTech Tower, MG Road, Jaipur, Rajasthan 302001",
  businessHours: "Mon - Sat: 9:00 AM - 7:00 PM IST",
  theme: "system",
};

const isBrowser = () => typeof window !== "undefined";

export function getPlatformConfig(): PlatformConfig {
  if (!isBrowser()) return DEFAULT_PLATFORM_CONFIG;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PLATFORM_CONFIG;
    return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLATFORM_CONFIG;
  }
}

export function setPlatformConfig(config: Partial<PlatformConfig>): PlatformConfig {
  if (!isBrowser()) return DEFAULT_PLATFORM_CONFIG;
  const current = getPlatformConfig();
  const next = { ...current, ...config };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("platform-config-change"));
  return next;
}

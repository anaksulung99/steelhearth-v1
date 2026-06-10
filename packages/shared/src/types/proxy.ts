export interface ProxyItem {
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  anonymity?: 'elite' | 'anonymous' | 'transparent';
  speed?: number;
  uptime?: number;
  lastChecked?: Date;
  source: string;
  raw: string;
}

export interface ScraperConfig {
  maxProxies?: number;
  minSpeed?: number;
  minUptime?: number;
  preferredProtocols?: ('http' | 'https' | 'socks4' | 'socks5')[];
  countries?: string[];
  format?: "url" | "full" | "hostport";
}

export interface IPLookUpLiteResult {
  ip: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
  country_code?: string;
  country?: string;
  continent_code?: string;
  continent?: string;
}

export interface ProxyHealthTestResult {
  success: boolean
  responseTime: number
  ipReturned?: string
  error?: string
  errorCode?: string
  isBlacklisted?: boolean
  mode?: "health" | "worker-compat"
  observedCountry?: string
  targetUrl?: string
  pageReached?: boolean
  transport?: "http" | "socks4" | "socks5"
  suggestedCommand?: string
  notes?: string[]
  countryShort?: string;
  countryLong?: string;
  isp?: string;
  domain?: string;
  asn?: string;
}

export interface PlaywrightPreflightResult {
  installed: boolean
  browserName: "chromium"
  executablePath: string
  errorCode?: string
  message: string
  suggestedCommand?: string
  packageStatus: {
    playwright: boolean
    playwrightExtra: boolean
    stealthPlugin: boolean
  }
}

export interface ProxyScrapeSourceStatus {
  source: string
  status: "success" | "error"
  count: number
  detail?: string
}

export interface ProxyScrapeDiagnostics {
  totalScraped: number
  afterBaseFilters: number
  afterCountryFilter: number
  selectedCountries: string[]
  preferredProtocols: Array<"http" | "https" | "socks4" | "socks5">
  sourceStatuses: ProxyScrapeSourceStatus[]
  warnings: string[]
}

export interface ProxyScrapeResult {
  proxies: ProxyItem[]
  diagnostics: ProxyScrapeDiagnostics
}

export interface ProxyParseResult {
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string
  raw: string;
}

export interface ProxyCheckerTestResult {
  index: number;
  raw: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  status: "valid" | "error" | "not_supported";
  responseTime?: number;
  error?: string;
  ip?: string;
  ipNo?: string;
  isProxy?: number;
  proxyType?: string;
  countryShort?: string;
  countryLong?: string;
  proxyTypeName?: string;
  region?: string;
  city?: string;
  isp?: string;
  domain?: string;
  usageType?: string;
  asn?: string;
  as?: string;
  lastSeen?: string;
  threat?: string;
  provider?: string;
  fraudScore?: string;
  isResidential?: boolean;
  isMobile?: boolean;
  isISP?: boolean;
  isDatacenter?: boolean;

}

export const TEST_PROXY_MODES = {
  COUNTRY_SHORT: 1,
  COUNTRY_LONG: 2,
  REGION: 3,
  CITY: 4,
  ISP: 5,
  PROXY_TYPE: 6,
  IS_PROXY: 7,
  DOMAIN: 8,
  USAGE_TYPE: 9,
  ASN: 10,
  AS: 11,
  LAST_SEEN: 12,
  THREAT: 13,
  PROVIDER: 14,
  FRAUD_SCORE: 15,
  ALL: 100,
};
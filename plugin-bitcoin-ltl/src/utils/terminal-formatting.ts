/**
 * Advanced Terminal Formatting Utilities for ElizaOS
 * Provides comprehensive styling, themes, animations, and formatted output
 * Supports both basic and advanced terminal features
 */

// ============================================================================
// CORE CONSTANTS AND CONFIGURATION
// ============================================================================

// ANSI color codes with extended support
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',
  
  // Standard foreground colors
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  
  // Standard background colors
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  },

  // Extended 256-color support
  extended: {
    fg: (code: number) => `\x1b[38;5;${code}m`,
    bg: (code: number) => `\x1b[48;5;${code}m`,
  },

  // RGB color support (24-bit)
  rgb: {
    fg: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
    bg: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
  }
};

// Enhanced emoji collection with categories
const emojis = {
  // Core symbols
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
  cardano: '₳',
  polkadot: 'DOT',
  chainlink: 'LINK',
  polygon: 'MATIC',
  avalanche: 'AVAX',
  cosmos: 'ATOM',
  algorand: 'ALGO',
  stellar: 'XLM',
  ripple: 'XRP',
  litecoin: 'Ł',
  monero: 'ɱ',
  zcash: 'ZEC',
  dash: 'Ð',
  dogecoin: 'Ð',
  shiba: 'SHIB',
  usdt: 'USDT',
  usdc: 'USDC',
  dai: 'DAI',
  busd: 'BUSD',
  maker: 'MKR',
  compound: 'COMP',
  aave: 'AAVE',
  uniswap: 'UNI',
  sushi: 'SUSHI',
  curve: 'CRV',
  yearn: 'YFI',
  balancer: 'BAL',
  synthetix: 'SNX',

  // Financial and market
  stock: '📈',
  crypto: '🪙',
  etf: '📊',
  nft: '🖼️',
  money: '💰',
  chart: '📊',
  rocket: '🚀',
  fire: '🔥',
  diamond: '💎',
  crown: '👑',
  trophy: '🏆',
  medal: '🥇',
  target: '🎯',

  // Lifestyle and travel
  lifestyle: '🏠',
  travel: '✈️',
  hotel: '🏨',
  food: '🍽️',
  drink: '🍷',
  wine: '🍷',
  coffee: '☕',
  tea: '🫖',
  beer: '🍺',
  cocktail: '🍸',
  champagne: '🍾',
  whiskey: '🥃',
  cigar: '🚬',

  // Weather and environment
  weather: '🌤️',
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',
  rain: '🌧️',
  snow: '❄️',
  storm: '⛈️',
  rainbow: '🌈',

  // Communication and media
  news: '📰',
  alert: '🚨',
  bell: '🔔',
  megaphone: '📢',
  satellite: '🛰️',
  network: '🌐',
  api: '🔌',
  webhook: '🔗',
  socket: '🔌',
  server: '🖥️',

  // Status indicators
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  loading: '⏳',
  check: '✓',
  cross: '✗',
  question: '❓',
  exclamation: '❗',

  // Actions and controls
  gear: '⚙️',
  settings: '🔧',
  config: '⚙️',
  lock: '🔒',
  key: '🔑',
  shield: '🛡️',
  lightning: '⚡',
  sparkles: '✨',
  star: '⭐',
  heart: '❤️',
  brain: '🧠',
  flag: '🏁',
  compass: '🧭',
  map: '🗺️',
  clock: '🕐',
  calendar: '📅',

  // User and team
  user: '👤',
  team: '👥',
  group: '👥',

  // Data and storage
  database: '🗄️',
  cache: '💾',
  backup: '💾',
  restore: '📥',
  import: '📥',
  export: '📤',
  download: '⬇️',
  upload: '⬆️',

  // Interface elements
  search: '🔍',
  filter: '🔍',
  sort: '📊',
  tag: '🏷️',
  bookmark: '🔖',
  favorite: '⭐',
  like: '👍',
  dislike: '👎',
  share: '📤',
  copy: '📋',
  paste: '📋',
  cut: '✂️',
  edit: '✏️',
  delete: '🗑️',
  add: '➕',
  remove: '➖',
  plus: '➕',
  minus: '➖',

  // Mathematical symbols
  equal: '=',
  greater: '>',
  less: '<',
  infinity: '∞',
  percent: '%',
  dollar: '$',
  euro: '€',
  pound: '£',
  yen: '¥',

  // Arrows and navigation
  arrow: '→',
  arrowRight: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  arrowDown: '↓',
  arrowRightCurved: '↪️',
  arrowLeftCurved: '↩️',
  arrowUpCurved: '↪️',
  arrowDownCurved: '↩️',

  // Development and testing
  monitor: '📺',
  analytics: '📊',
  performance: '⚡',
  health: '🏥',
  status: '📊',
  metrics: '📈',
  log: '📝',
  debug: '🐛',
  test: '🧪',
  deploy: '🚀',
  build: '🔨',
  start: '▶️',
  stop: '⏹️',
  restart: '🔄',
  update: '🔄',
  sync: '🔄',

  // Integration and connectivity
  integration: '🔗',
  connection: '🔗',
  link: '🔗',
  chain: '⛓️',
  bridge: '🌉',
  gateway: '🚪',
  portal: '🚪',
  tunnel: '🚇',
  pipe: '🔗',
  wire: '🔌',
  cable: '🔌',
  antenna: '📡',
  router: '📡',
  switch: '🔌',
  repeater: '🔌',
  amplifier: '🔊',
  mixer: '🎛️',
  equalizer: '🎛️',
  tuner: '🎛️',
  metronome: '🎵',
  tuning: '🎵',
  pitch: '🎵',
  frequency: '📡',
  wavelength: '📡',
  amplitude: '📡',
  phase: '📡',
  cycle: '🔄',
  oscillation: '🔄',
  vibration: '📳',
  resonance: '🔊',
  echo: '🔊',
  reverb: '🔊',
  delay: '⏱️',
  timing: '⏱️',
  rhythm: '🎵',
  beat: '💓',
  pulse: '💓',
  heartbeat: '💓',
  breathing: '��',
  respiration: '🫁',
  circulation: '🩸',
  blood: '🩸',
  oxygen: '🫧',
  carbon: '🫧',
  nitrogen: '🫧',
  hydrogen: '🫧',
  helium: '🫧',
  neon: '🫧',
  argon: '🫧',
  krypton: '🫧',
  xenon: '🫧',
  radon: '🫧',
  uranium: '☢️',
  plutonium: '☢️',
  thorium: '☢️',
  radium: '☢️',
  polonium: '☢️',
  actinium: '☢️',
  protactinium: '☢️',
  neptunium: '☢️',
  americium: '☢️',
  curium: '☢️',
  berkelium: '☢️',
  californium: '☢️',
  einsteinium: '☢️',
  fermium: '☢️',
  mendelevium: '☢️',
  nobelium: '☢️',
  lawrencium: '☢️',
  rutherfordium: '☢️',
  dubnium: '☢️',
  seaborgium: '☢️',
  bohrium: '☢️',
  hassium: '☢️',
  meitnerium: '☢️',
  darmstadtium: '☢️',
  roentgenium: '☢️',
  copernicium: '☢️',
  nihonium: '☢️',
  flerovium: '☢️',
  moscovium: '☢️',
  livermorium: '☢️',
  tennessine: '☢️',
  oganesson: '☢️',
};

// Service-specific emoji mapping
const serviceEmojis = {
  // Core services
  bitcoinData: emojis.bitcoin,
  bitcoinNetwork: emojis.network,
  stockData: emojis.stock,
  altcoinData: emojis.crypto,
  etfData: emojis.etf,
  nftData: emojis.nft,
  lifestyleData: emojis.lifestyle,
  homeCooking: emojis.food,
  beverageKnowledge: emojis.drink,
  dailyCulinary: emojis.food,
  travelData: emojis.travel,
  realTimeData: emojis.lightning,
  morningBriefing: emojis.news,
  opportunityAlert: emojis.alert,
  performanceTracking: emojis.performance,
  knowledgeDigest: emojis.brain,
  scheduler: emojis.clock,
  
  // Technical services
  'cache-service': emojis.cache,
  slackIngestion: emojis.webhook,
  configurationManager: emojis.config,
  centralizedConfigService: emojis.settings,
  comprehensiveErrorHandler: emojis.shield,
  predictiveAnalyticsService: emojis.analytics,
  advancedAlertingService: emojis.alert,
  integrationService: emojis.integration,
  starterService: emojis.rocket,
  marketDataService: emojis.chart,
  socialSentimentService: emojis.heart,
  newsDataService: emojis.news,
  googleHotelsScraper: emojis.hotel,
  
  // Default fallback
  default: emojis.gear,
};

// ============================================================================
// THEME SYSTEM
// ============================================================================

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    muted: string;
    background: string;
    foreground: string;
  };
  styles: {
    header: string;
    subheader: string;
    body: string;
    accent: string;
  };
}

const themes: Record<string, Theme> = {
  default: {
    name: 'Default',
    colors: {
      primary: 'cyan',
      secondary: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      muted: 'dim',
      background: 'black',
      foreground: 'white',
    },
    styles: {
      header: 'bright',
      subheader: 'underscore',
      body: 'dim',
      accent: 'bright',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: 'cyan',
      secondary: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      muted: 'dim',
      background: 'black',
      foreground: 'white',
    },
    styles: {
      header: 'bright',
      subheader: 'underscore',
      body: 'dim',
      accent: 'bright',
    },
  },
  light: {
    name: 'Light',
    colors: {
      primary: 'blue',
      secondary: 'cyan',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      muted: 'dim',
      background: 'white',
      foreground: 'black',
    },
    styles: {
      header: 'bright',
      subheader: 'underscore',
      body: 'dim',
      accent: 'bright',
    },
  },
  bitcoin: {
    name: 'Bitcoin',
    colors: {
      primary: 'yellow',
      secondary: 'orange',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'cyan',
      muted: 'dim',
      background: 'black',
      foreground: 'white',
    },
    styles: {
      header: 'bright',
      subheader: 'underscore',
      body: 'dim',
      accent: 'bright',
    },
  },
  luxury: {
    name: 'Luxury',
    colors: {
      primary: 'magenta',
      secondary: 'cyan',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      muted: 'dim',
      background: 'black',
      foreground: 'white',
    },
    styles: {
      header: 'bright',
      subheader: 'underscore',
      body: 'dim',
      accent: 'bright',
    },
  },
};

// ============================================================================
// ANIMATION FRAMES
// ============================================================================

const animations = {
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  bars: ['▰▱▱▱▱▱▱▱', '▰▰▱▱▱▱▱▱', '▰▰▰▱▱▱▱▱', '▰▰▰▰▱▱▱▱', '▰▰▰▰▰▱▱▱', '▰▰▰▰▰▰▱▱', '▰▰▰▰▰▰▰▱', '▰▰▰▰▰▰▰▰'],
  pulse: ['●', '○', '●', '○'],
  wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
  bitcoin: ['₿', '⚡', '₿', '⚡'],
  rocket: ['🚀', '🔥', '🚀', '🔥'],
  loading: ['⏳', '⌛', '⏳', '⌛'],
};

// ============================================================================
// CORE FORMATTING FUNCTIONS
// ============================================================================

/**
 * Map theme color names to valid ANSI color names or special cases
 */
function resolveColor(color: string): keyof typeof colors.fg | 'dim' | 'bright' | 'extended' | 'rgb' {
  switch (color) {
    case 'primary': return 'cyan';
    case 'secondary': return 'blue';
    case 'success': return 'green';
    case 'warning': return 'yellow';
    case 'error': return 'red';
    case 'info': return 'blue';
    case 'muted': return 'dim';
    case 'background': return 'black';
    case 'foreground': return 'white';
    default:
      if ((colors.fg as any)[color]) return color as keyof typeof colors.fg;
      return 'white';
  }
}

/**
 * Apply color to text with theme support
 */
export function colorize(
  text: string, 
  color: keyof typeof colors.fg | keyof typeof colors.bg | 'dim' | 'bright' | 'extended' | 'rgb',
  isBackground = false,
  theme?: string
): string {
  if (!supportsColors()) {
    return text;
  }
  const resolvedColor = resolveColor(color);
  if (resolvedColor === 'dim') {
    return `${colors.dim}${text}${colors.reset}`;
  }
  if (resolvedColor === 'bright') {
    return `${colors.bright}${text}${colors.reset}`;
  }
  const colorCode = isBackground ? colors.bg[resolvedColor as keyof typeof colors.bg] : colors.fg[resolvedColor as keyof typeof colors.fg];
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Apply extended color (256-color support)
 */
export function colorizeExtended(text: string, code: number, isBackground = false): string {
  const colorCode = isBackground ? colors.extended.bg(code) : colors.extended.fg(code);
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Apply RGB color (24-bit color support)
 */
export function colorizeRGB(text: string, r: number, g: number, b: number, isBackground = false): string {
  const colorCode = isBackground ? colors.rgb.bg(r, g, b) : colors.rgb.fg(r, g, b);
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Make text bold
 */
export function bold(text: string): string {
  return colorize(text, 'bright');
}

/**
 * Make text dim
 */
export function dim(text: string): string {
  return colorize(text, 'dim');
}

/**
 * Underline text
 */
export function underline(text: string): string {
  return `${colors.underscore}${text}${colors.reset}`;
}

/**
 * Strikethrough text
 */
export function strikethrough(text: string): string {
  return `${colors.strikethrough}${text}${colors.reset}`;
}

/**
 * Reverse text colors
 */
export function reverse(text: string): string {
  return `${colors.reverse}${text}${colors.reset}`;
}

/**
 * Blink text (may not work in all terminals)
 */
export function blink(text: string): string {
  return `${colors.blink}${text}${colors.reset}`;
}

// ============================================================================
// MESSAGE FORMATTING
// ============================================================================

/**
 * Create a success message with theme support
 */
export function success(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.success} ${colorize(text, resolveColor(currentTheme.colors.success))}`;
}

/**
 * Create a warning message with theme support
 */
export function warning(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.warning} ${colorize(text, resolveColor(currentTheme.colors.warning))}`;
}

/**
 * Create an error message with theme support
 */
export function error(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.error} ${colorize(text, resolveColor(currentTheme.colors.error))}`;
}

/**
 * Create an info message with theme support
 */
export function info(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.info} ${colorize(text, resolveColor(currentTheme.colors.info))}`;
}

/**
 * Create a loading message with theme support
 */
export function loading(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.loading} ${colorize(text, resolveColor(currentTheme.colors.info))}`;
}

/**
 * Create a question message
 */
export function question(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.question} ${colorize(text, resolveColor(currentTheme.colors.info))}`;
}

/**
 * Create an exclamation message
 */
export function exclamation(text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emojis.exclamation} ${colorize(text, resolveColor(currentTheme.colors.warning))}`;
}

// ============================================================================
// SERVICE STATUS FORMATTING
// ============================================================================

/**
 * Create a service status message with enhanced styling
 */
export function serviceStatus(
  serviceName: string, 
  status: 'enabled' | 'disabled' | 'starting' | 'started' | 'stopped' | 'error' | 'warning',
  theme = 'default'
): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  const currentTheme = themes[theme];
  
  switch (status) {
    case 'enabled':
    case 'started':
      return `${emoji} ${colorize(serviceName, resolveColor(currentTheme.colors.success))} ${emojis.success}`;
    case 'starting':
      return `${emoji} ${colorize(serviceName, resolveColor(currentTheme.colors.warning))} ${emojis.loading}`;
    case 'disabled':
    case 'stopped':
      return `${emoji} ${colorize(serviceName, resolveColor(currentTheme.colors.muted))} ${emojis.cross}`;
    case 'error':
      return `${emoji} ${colorize(serviceName, resolveColor(currentTheme.colors.error))} ${emojis.error}`;
    case 'warning':
      return `${emoji} ${colorize(serviceName, resolveColor(currentTheme.colors.warning))} ${emojis.warning}`;
    default:
      return `${emoji} ${serviceName}`;
  }
}

/**
 * Create a detailed service status with additional information
 */
export function serviceStatusDetailed(
  serviceName: string,
  status: 'enabled' | 'disabled' | 'starting' | 'started' | 'stopped' | 'error' | 'warning',
  details?: {
    uptime?: string;
    version?: string;
    lastUpdate?: string;
    performance?: string;
  },
  theme = 'default'
): string {
  const baseStatus = serviceStatus(serviceName, status, theme);
  const currentTheme = themes[theme];
  
  if (!details) return baseStatus;
  
  const detailLines = [];
  if (details.uptime) detailLines.push(`Uptime: ${colorize(details.uptime, resolveColor(currentTheme.colors.info))}`);
  if (details.version) detailLines.push(`Version: ${colorize(details.version, resolveColor(currentTheme.colors.info))}`);
  if (details.lastUpdate) detailLines.push(`Last Update: ${colorize(details.lastUpdate, resolveColor(currentTheme.colors.info))}`);
  if (details.performance) detailLines.push(`Performance: ${colorize(details.performance, resolveColor(currentTheme.colors.info))}`);
  
  if (detailLines.length === 0) return baseStatus;
  
  return `${baseStatus}\n  ${detailLines.join(' | ')}`;
}

// ============================================================================
// CONFIGURATION AND SUMMARY FORMATTING
// ============================================================================

/**
 * Create a comprehensive configuration summary
 */
export function configSummary(
  data: {
    servicesEnabled: number;
    servicesDisabled: number;
    servicesWarning: number;
    servicesError: number;
    enabledServices: string[];
    disabledServices: string[];
    warningServices: string[];
    errorServices: string[];
    globalConfig?: any;
    theme?: string;
  },
  theme = 'default'
): string {
  const currentTheme = themes[theme];
  const lines = [
    `${emojis.config} ${bold(colorize('Configuration Summary', resolveColor(currentTheme.colors.primary)))}`,
    '',
    `${emojis.check} ${colorize(`${data.servicesEnabled} services enabled`, resolveColor(currentTheme.colors.success))}`,
    `${emojis.cross} ${colorize(`${data.servicesDisabled} services disabled`, resolveColor(currentTheme.colors.muted))}`,
    `${emojis.warning} ${colorize(`${data.servicesWarning} services with warnings`, resolveColor(currentTheme.colors.warning))}`,
    `${emojis.error} ${colorize(`${data.servicesError} services with errors`, resolveColor(currentTheme.colors.error))}`,
    '',
    `${emojis.gear} ${bold(colorize('Service Status:', resolveColor(currentTheme.colors.primary)))}`,
  ];

  // Add enabled services
  if (data.enabledServices.length > 0) {
    lines.push(`${colorize('Enabled:', resolveColor(currentTheme.colors.success))}`);
    data.enabledServices.forEach(service => 
      lines.push(`  ${serviceStatus(service, 'enabled', theme)}`)
    );
  }

  // Add disabled services
  if (data.disabledServices.length > 0) {
    lines.push(`${colorize('Disabled:', resolveColor(currentTheme.colors.muted))}`);
    data.disabledServices.forEach(service => 
      lines.push(`  ${serviceStatus(service, 'disabled', theme)}`)
    );
  }

  // Add warning services
  if (data.warningServices.length > 0) {
    lines.push(`${colorize('Warnings:', resolveColor(currentTheme.colors.warning))}`);
    data.warningServices.forEach(service => 
      lines.push(`  ${serviceStatus(service, 'warning', theme)}`)
    );
  }

  // Add error services
  if (data.errorServices.length > 0) {
    lines.push(`${colorize('Errors:', resolveColor(currentTheme.colors.error))}`);
    data.errorServices.forEach(service => 
      lines.push(`  ${serviceStatus(service, 'error', theme)}`)
    );
  }

  // Add global configuration
  if (data.globalConfig) {
    lines.push('');
    lines.push(`${emojis.settings} ${bold(colorize('Global Configuration:', resolveColor(currentTheme.colors.primary)))}`);
    Object.entries(data.globalConfig).forEach(([key, value]) => {
      const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      lines.push(`  ${colorize(key, resolveColor(currentTheme.colors.info))}: ${formattedValue}`);
    });
  }

  return lines.join('\n');
}

// ============================================================================
// BANNER AND HEADER FORMATTING
// ============================================================================

/**
 * Create an enhanced startup banner with theme support
 */
export function startupBanner(theme = 'default'): string {
  const currentTheme = themes[theme];
  const bannerEmoji = theme === 'bitcoin' ? emojis.bitcoin : emojis.rocket;
  return `
${colorize('╔══════════════════════════════════════════════════════════════╗', resolveColor(currentTheme.colors.primary))}
${colorize('║', resolveColor(currentTheme.colors.primary))}                    ${bold(colorize('ElizaOS Bitcoin LTL Agent', resolveColor(currentTheme.colors.primary)))}                    ${colorize('║', resolveColor(currentTheme.colors.primary))}
${colorize('║', resolveColor(currentTheme.colors.primary))}              ${colorize('Live The Life You Deserve', resolveColor(currentTheme.colors.muted))}              ${colorize('║', resolveColor(currentTheme.colors.primary))}
${colorize('║', resolveColor(currentTheme.colors.primary))}                    ${colorize(`Theme: ${currentTheme.name}`, resolveColor(currentTheme.colors.info))}                    ${colorize('║', resolveColor(currentTheme.colors.primary))}
${colorize('╚══════════════════════════════════════════════════════════════╝', resolveColor(currentTheme.colors.primary))}
${bannerEmoji} ${colorize('Initializing services...', resolveColor(currentTheme.colors.warning))}
`;
}

/**
 * Create a service startup message with animation support
 */
export function serviceStartup(serviceName: string, theme = 'default'): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  const currentTheme = themes[theme];
  return `${emoji} ${colorize(`${serviceName} starting...`, resolveColor(currentTheme.colors.warning))}`;
}

/**
 * Create a service started message
 */
export function serviceStarted(serviceName: string, theme = 'default'): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  const currentTheme = themes[theme];
  return `${emoji} ${colorize(`${serviceName} started successfully`, resolveColor(currentTheme.colors.success))}`;
}

/**
 * Create a service error message with detailed error information
 */
export function serviceError(serviceName: string, error: string, theme = 'default'): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  const currentTheme = themes[theme];
  return `${emoji} ${colorize(`${serviceName} error:`, resolveColor(currentTheme.colors.error))} ${error}`;
}

// ============================================================================
// PROGRESS AND ANIMATION FORMATTING
// ============================================================================

/**
 * Create an enhanced progress bar with theme support
 */
export function progressBar(
  current: number, 
  total: number, 
  width = 20, 
  theme = 'default',
  showPercentage = true,
  showNumbers = false
): string {
  const currentTheme = themes[theme];
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const filledBar = colorize('█'.repeat(filled), resolveColor(currentTheme.colors.success));
  const emptyBar = colorize('░'.repeat(empty), resolveColor(currentTheme.colors.muted));
  
  let result = `${filledBar}${emptyBar}`;
  
  if (showPercentage) {
    result += ` ${colorize(`${percentage}%`, resolveColor(currentTheme.colors.info))}`;
  }
  
  if (showNumbers) {
    result += ` ${colorize(`(${current}/${total})`, resolveColor(currentTheme.colors.muted))}`;
  }
  
  return result;
}

/**
 * Create an animated spinner
 */
export function spinner(frame: number, text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  const spinnerFrame = animations.spinner[frame % animations.spinner.length];
  return `${spinnerFrame} ${colorize(text, resolveColor(currentTheme.colors.info))}`;
}

/**
 * Create an animated loading bar
 */
export function loadingBar(frame: number, text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  const barFrame = animations.bars[frame % animations.bars.length];
  return `${barFrame} ${colorize(text, resolveColor(currentTheme.colors.info))}`;
}

/**
 * Create an animated bitcoin loading indicator
 */
export function bitcoinLoading(frame: number, text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  const bitcoinFrame = animations.bitcoin[frame % animations.bitcoin.length];
  return `${bitcoinFrame} ${colorize(text, resolveColor(currentTheme.colors.warning))}`;
}

// ============================================================================
// TABLE AND DATA FORMATTING
// ============================================================================

/**
 * Create an enhanced table header with theme support
 */
export function tableHeader(headers: string[], theme = 'default'): string {
  const currentTheme = themes[theme];
  const headerRow = headers.map(header => bold(colorize(header, resolveColor(currentTheme.colors.primary)))).join(' | ');
  const separator = headers.map(() => '─'.repeat(10)).join('─┼─');
  return `${headerRow}\n${colorize(separator, resolveColor(currentTheme.colors.muted))}`;
}

/**
 * Create a table row with alternating row colors
 */
export function tableRow(cells: string[], isAlternate = false, theme = 'default'): string {
  const currentTheme = themes[theme];
  const rowColor = isAlternate ? resolveColor(currentTheme.colors.muted) : resolveColor(currentTheme.colors.foreground);
  return cells.map(cell => colorize(cell, rowColor)).join(' | ');
}

/**
 * Create a complete table with headers and data
 */
export function createTable(
  headers: string[], 
  data: string[][], 
  theme = 'default'
): string {
  const header = tableHeader(headers, theme);
  const rows = data.map((row, index) => tableRow(row, index % 2 === 1, theme));
  return [header, ...rows].join('\n');
}

// ============================================================================
// LAYOUT AND STRUCTURE FORMATTING
// ============================================================================

/**
 * Create a divider with theme support
 */
export function divider(char = '─', length = 60, theme = 'default'): string {
  const currentTheme = themes[theme];
  return colorize(char.repeat(length), resolveColor(currentTheme.colors.muted));
}

/**
 * Create a section header with enhanced styling
 */
export function sectionHeader(title: string, emoji = emojis.star, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `\n${emoji} ${bold(colorize(title, resolveColor(currentTheme.colors.primary)))}`;
}

/**
 * Create a subsection header
 */
export function subsectionHeader(title: string, emoji = emojis.arrow, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${emoji} ${colorize(title, resolveColor(currentTheme.colors.secondary))}`;
}

/**
 * Create a box around text
 */
export function box(text: string, title?: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length), title ? title.length : 0);
  const width = maxLength + 4;
  
  const topBorder = colorize('┌' + '─'.repeat(width - 2) + '┐', resolveColor(currentTheme.colors.primary));
  const bottomBorder = colorize('└' + '─'.repeat(width - 2) + '┘', resolveColor(currentTheme.colors.primary));
  
  let result = [topBorder];
  
  if (title) {
    const titleLine = colorize(`│ ${title.padEnd(width - 3)} │`, resolveColor(currentTheme.colors.primary));
    result.push(titleLine);
    result.push(colorize('├' + '─'.repeat(width - 2) + '┤', resolveColor(currentTheme.colors.primary)));
  }
  
  lines.forEach(line => {
    const paddedLine = line.padEnd(width - 3);
    result.push(colorize(`│ ${paddedLine} │`, resolveColor(currentTheme.colors.primary)));
  });
  
  result.push(bottomBorder);
  return result.join('\n');
}

// ============================================================================
// NUMERIC AND FINANCIAL FORMATTING
// ============================================================================

/**
 * Format a number with color based on value and theme
 */
export function formatNumber(value: number, decimals = 2, theme = 'default'): string {
  const currentTheme = themes[theme];
  const formatted = value.toFixed(decimals);
  
  if (value > 0) {
    return colorize(`+${formatted}`, resolveColor(currentTheme.colors.success));
  } else if (value < 0) {
    return colorize(formatted, resolveColor(currentTheme.colors.error));
  }
  return colorize(formatted, resolveColor(currentTheme.colors.muted));
}

/**
 * Format a percentage with color and theme support
 */
export function formatPercentage(value: number, theme = 'default'): string {
  return formatNumber(value, 2, theme) + '%';
}

/**
 * Format a price with currency symbol and theme support
 */
export function formatPrice(value: number, currency = '$', theme = 'default'): string {
  const currentTheme = themes[theme];
  return colorize(`${currency}${value.toLocaleString()}`, resolveColor(currentTheme.colors.warning));
}

/**
 * Format a large number with appropriate suffixes (K, M, B, T)
 */
export function formatLargeNumber(value: number, theme = 'default'): string {
  const currentTheme = themes[theme];
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(value)) / 3);
  const scaled = value / Math.pow(10, magnitude * 3);
  const suffix = suffixes[magnitude];
  
  return colorize(`${scaled.toFixed(1)}${suffix}`, resolveColor(currentTheme.colors.info));
}

/**
 * Format a bitcoin amount with proper symbol
 */
export function formatBitcoin(amount: number, theme = 'default'): string {
  const currentTheme = themes[theme];
  return colorize(`${emojis.bitcoin}${amount.toFixed(8)}`, resolveColor(currentTheme.colors.warning));
}

/**
 * Prominent display for Bitcoin price and Fear & Greed Index
 */
export function prominentBitcoinMetrics(
  price: number,
  change24h: number,
  fearGreedIndex: number,
  fearGreedValue: string,
  theme = 'default'
): string {
  const currentTheme = themes[theme];
  const priceStr = bold(colorize(`₿ $${price.toLocaleString()}`, resolveColor('yellow')));
  const changeStr = colorize(
    `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`,
    change24h > 0 ? resolveColor('green') : change24h < 0 ? resolveColor('red') : resolveColor('dim')
  );
  const fgStr = bold(colorize(`😨 Fear & Greed: ${fearGreedIndex} (${fearGreedValue})`, resolveColor('magenta')));
  return box(
    `${priceStr}  ${changeStr}\n${fgStr}`,
    'BITCOIN MARKET',
    theme
  );
}

// ============================================================================
// STATUS AND INDICATOR FORMATTING
// ============================================================================

/**
 * Create a status indicator with theme support
 */
export function statusIndicator(
  status: 'online' | 'offline' | 'warning' | 'error' | 'loading', 
  theme = 'default'
): string {
  const currentTheme = themes[theme];
  
  switch (status) {
    case 'online':
      return colorize('●', resolveColor(currentTheme.colors.success));
    case 'offline':
      return colorize('●', resolveColor(currentTheme.colors.muted));
    case 'warning':
      return colorize('●', resolveColor(currentTheme.colors.warning));
    case 'error':
      return colorize('●', resolveColor(currentTheme.colors.error));
    case 'loading':
      return colorize('●', resolveColor(currentTheme.colors.info));
  }
}

/**
 * Create a key-value pair display with theme support
 */
export function keyValue(key: string, value: any, theme = 'default'): string {
  const currentTheme = themes[theme];
  const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  return `${colorize(key, resolveColor(currentTheme.colors.primary))}: ${formattedValue}`;
}

/**
 * Create a list item with theme support
 */
export function listItem(text: string, bullet = '•', theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${colorize(bullet, resolveColor(currentTheme.colors.success))} ${text}`;
}

/**
 * Create a numbered list item with theme support
 */
export function numberedItem(index: number, text: string, theme = 'default'): string {
  const currentTheme = themes[theme];
  return `${colorize(`${index}.`, resolveColor(currentTheme.colors.primary))} ${text}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get available themes
 */
export function getAvailableThemes(): string[] {
  return Object.keys(themes);
}

/**
 * Get theme information
 */
export function getThemeInfo(themeName: string): Theme | null {
  return themes[themeName] || null;
}

/**
 * Check if terminal supports colors
 */
export function supportsColors(): boolean {
  return process.stdout.isTTY && process.env.NO_COLOR !== '1';
}

/**
 * Strip all ANSI color codes from text
 */
export function stripColors(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get terminal width
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Truncate text to fit terminal width
 */
export function truncateText(text: string, maxWidth?: number): string {
  const width = maxWidth || getTerminalWidth();
  if (text.length <= width) return text;
  return text.substring(0, width - 3) + '...';
}

/**
 * Center text in terminal
 */
export function centerText(text: string, width?: number): string {
  const termWidth = width || getTerminalWidth();
  const strippedText = stripColors(text);
  const padding = Math.max(0, Math.floor((termWidth - strippedText.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Right-align text in terminal
 */
export function rightAlignText(text: string, width?: number): string {
  const termWidth = width || getTerminalWidth();
  const strippedText = stripColors(text);
  const padding = Math.max(0, termWidth - strippedText.length);
  return ' '.repeat(padding) + text;
}

// ============================================================================
// ADVANCED FORMATTING UTILITIES
// ============================================================================

/**
 * Creates gradient text effect using multiple colors
 */
export function gradientText(text: string, gradientColors: string[], theme = 'default'): string {
  if (!supportsColors()) return text;
  
  const colorCodes = gradientColors.map(color => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return colors.rgb.fg(r, g, b);
    }
    return colors.fg[color as keyof typeof colors.fg] || colors.fg.white;
  });

  const chars = text.split('');
  const step = (colorCodes.length - 1) / (chars.length - 1);
  
  return chars.map((char, i) => {
    const colorIndex = Math.floor(i * step);
    const color = colorCodes[Math.min(colorIndex, colorCodes.length - 1)];
    return `${color}${char}${colors.reset}`;
  }).join('');
}

/**
 * Creates rainbow text effect
 */
export function rainbowText(text: string, theme = 'default'): string {
  if (!supportsColors()) return text;
  
  const rainbowColors = [
    colors.rgb.fg(255, 0, 0),    // Red
    colors.rgb.fg(255, 127, 0),  // Orange
    colors.rgb.fg(255, 255, 0),  // Yellow
    colors.rgb.fg(0, 255, 0),    // Green
    colors.rgb.fg(0, 0, 255),    // Blue
    colors.rgb.fg(75, 0, 130),   // Indigo
    colors.rgb.fg(148, 0, 211),  // Violet
  ];

  return gradientText(text, rainbowColors, theme);
}

/**
 * Typewriter effect for text animation
 */
export function typewriterText(text: string, delay = 50, theme = 'default'): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      process.stdout.write(text[index]);
      index++;
      
      if (index >= text.length) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, delay);
  });
}

/**
 * Custom progress bar with advanced options
 */
export function customProgressBar(
  current: number,
  total: number,
  options: {
    width?: number;
    theme?: string;
    showPercentage?: boolean;
    showNumbers?: boolean;
    showSpeed?: boolean;
    showETA?: boolean;
    customChars?: { filled: string; empty: string; left: string; right: string };
    label?: string;
  } = {}
): string {
  const {
    width = 20,
    theme = 'default',
    showPercentage = true,
    showNumbers = false,
    showSpeed = false,
    showETA = false,
    customChars,
    label
  } = options;

  const chars = customChars || { filled: '█', empty: '░', left: '[', right: ']' };
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filledWidth = Math.round((percentage / 100) * width);
  const emptyWidth = width - filledWidth;

  const bar = chars.filled.repeat(filledWidth) + chars.empty.repeat(emptyWidth);
  const themeColors = getThemeInfo(theme)?.colors || themes.default.colors;

  let result = `${chars.left}${colorize(bar, resolveColor('primary'), false, theme)}${chars.right}`;

  if (showPercentage) {
    result += ` ${colorize(`${percentage.toFixed(1)}%`, resolveColor('info'), false, theme)}`;
  }

  if (showNumbers) {
    result += ` ${colorize(`(${current}/${total})`, resolveColor('muted'), false, theme)}`;
  }

  if (label) {
    result = `${colorize(label, resolveColor('secondary'), false, theme)} ${result}`;
  }

  return result;
}

/**
 * Status badge with custom styling
 */
export function statusBadge(
  status: string,
  type: 'success' | 'warning' | 'error' | 'info' | 'neutral',
  theme = 'default'
): string {
  const badges = {
    success: { left: '[', right: ']', color: 'success' },
    warning: { left: '[', right: ']', color: 'warning' },
    error: { left: '[', right: ']', color: 'error' },
    info: { left: '[', right: ']', color: 'info' },
    neutral: { left: '[', right: ']', color: 'muted' }
  };

  const badge = badges[type];
  const themeColors = getThemeInfo(theme)?.colors || themes.default.colors;

  return `${badge.left}${colorize(status.toUpperCase(), resolveColor(badge.color), false, theme)}${badge.right}`;
}

/**
 * Collapsible section with toggle functionality
 */
export function collapsibleSection(
  title: string,
  content: string,
  isExpanded = false,
  theme = 'default'
): string {
  const toggle = isExpanded ? '▼' : '▶';
  const header = `${colorize(toggle, resolveColor('primary'), false, theme)} ${colorize(title, resolveColor('header'), false, theme)}`;
  
  if (!isExpanded) {
    return header;
  }

  return `${header}\n${content}`;
}

/**
 * Notification banner with different types
 */
export function notificationBanner(
  message: string,
  type: 'success' | 'warning' | 'error' | 'info',
  theme = 'default'
): string {
  const icons = {
    success: emojis.success,
    warning: emojis.warning,
    error: emojis.error,
    info: emojis.info
  };

  const icon = icons[type];
  const width = getTerminalWidth();
  const padding = 4;
  const contentWidth = width - padding * 2;
  
  const lines = message.split('\n').map(line => 
    truncateText(line, contentWidth)
  );

  const topBorder = '─'.repeat(width);
  const bottomBorder = '─'.repeat(width);

  const content = lines.map(line => {
    const paddedLine = line.padEnd(contentWidth);
    return `│ ${colorize(paddedLine, resolveColor(type), false, theme)} │`;
  }).join('\n');

  return `${colorize(topBorder, resolveColor('muted'), false, theme)}\n${content}\n${colorize(bottomBorder, resolveColor('muted'), false, theme)}`;
}

/**
 * Command prompt styling
 */
export function commandPrompt(
  command: string,
  args: string[] = [],
  theme = 'default'
): string {
  const prompt = colorize('$', resolveColor('primary'), false, theme);
  const cmd = colorize(command, resolveColor('secondary'), false, theme);
  const argumentsStr = args.map(arg => colorize(arg, resolveColor('muted'), false, theme)).join(' ');
  
  return `${prompt} ${cmd} ${argumentsStr}`;
}

/**
 * Timestamp formatting
 */
export function timestamp(
  date: Date = new Date(),
  format: 'short' | 'long' | 'iso' | 'relative' = 'short',
  theme = 'default'
): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  let timeStr: string;

  switch (format) {
    case 'short':
      timeStr = date.toLocaleTimeString();
      break;
    case 'long':
      timeStr = date.toLocaleString();
      break;
    case 'iso':
      timeStr = date.toISOString();
      break;
    case 'relative':
      if (diff < 60000) timeStr = 'just now';
      else if (diff < 3600000) timeStr = `${Math.floor(diff / 60000)}m ago`;
      else if (diff < 86400000) timeStr = `${Math.floor(diff / 3600000)}h ago`;
      else timeStr = `${Math.floor(diff / 86400000)}d ago`;
      break;
    default:
      timeStr = date.toLocaleTimeString();
  }

  return colorize(`[${timeStr}]`, resolveColor('muted'), false, theme);
}

/**
 * Breadcrumb navigation
 */
export function breadcrumbs(
  paths: string[],
  separator = ' > ',
  theme = 'default'
): string {
  return paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const color = isLast ? 'primary' : 'muted';
    return colorize(path, resolveColor(color), false, theme);
  }).join(colorize(separator, resolveColor('muted'), false, theme));
}

/**
 * Tooltip display
 */
export function tooltip(
  text: string,
  tooltipText: string,
  theme = 'default'
): string {
  const width = getTerminalWidth();
  const maxTooltipWidth = Math.min(60, width - 10);
  
  const wrappedTooltip = tooltipText
    .split('\n')
    .map(line => truncateText(line, maxTooltipWidth))
    .join('\n');

  const tooltipLines = wrappedTooltip.split('\n');
  const tooltipWidth = Math.max(...tooltipLines.map(line => line.length));

  const topBorder = '─'.repeat(tooltipWidth + 2);
  const bottomBorder = '─'.repeat(tooltipWidth + 2);

  const tooltipContent = tooltipLines.map(line => {
    const paddedLine = line.padEnd(tooltipWidth);
    return `│ ${colorize(paddedLine, resolveColor('info'), false, theme)} │`;
  }).join('\n');

  return `${text}\n${colorize(topBorder, resolveColor('muted'), false, theme)}\n${tooltipContent}\n${colorize(bottomBorder, resolveColor('muted'), false, theme)}`;
}

/**
 * Custom spinner with different styles
 */
export function customSpinner(
  frame: number,
  text: string,
  style: 'dots' | 'bars' | 'arrows' | 'bitcoin' | 'custom' = 'dots',
  customFrames?: string[],
  theme = 'default'
): string {
  let frames: string[];

  switch (style) {
    case 'dots':
      frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      break;
    case 'bars':
      frames = ['▰▱▱▱▱▱▱▱', '▰▰▱▱▱▱▱▱', '▰▰▰▱▱▱▱▱', '▰▰▰▰▱▱▱▱', '▰▰▰▰▰▱▱▱', '▰▰▰▰▰▰▱▱', '▰▰▰▰▰▰▰▱', '▰▰▰▰▰▰▰▰'];
      break;
    case 'arrows':
      frames = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];
      break;
    case 'bitcoin':
      frames = ['₿', '⚡', '🔗', '🌐', '💎', '🚀', '🔥', '⭐'];
      break;
    case 'custom':
      frames = customFrames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      break;
    default:
      frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  }

  const spinnerChar = frames[frame % frames.length];
  return `${colorize(spinnerChar, resolveColor('primary'), false, theme)} ${text}`;
}

/**
 * Countdown timer display
 */
export function countdownTimer(
  seconds: number,
  label = 'Time remaining',
  theme = 'default'
): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  const progress = Math.max(0, Math.min(1, seconds / 60)); // Assuming 60 seconds max
  const bar = customProgressBar(seconds, 60, { width: 20, theme, showPercentage: false });
  
  return `${colorize(label, resolveColor('secondary'), false, theme)} ${colorize(timeStr, resolveColor('primary'), false, theme)} ${bar}`;
}

/**
 * File size formatting
 */
export function formatFileSize(bytes: number, theme = 'default'): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = size.toFixed(unitIndex === 0 ? 0 : 1);
  return colorize(`${formattedSize} ${units[unitIndex]}`, resolveColor('info'), false, theme);
}

/**
 * Memory usage indicator
 */
export function memoryUsageIndicator(
  used: number,
  total: number,
  theme = 'default'
): string {
  const percentage = (used / total) * 100;
  const bar = customProgressBar(used, total, { width: 15, theme, showPercentage: false });
  const usedFormatted = formatFileSize(used, theme);
  const totalFormatted = formatFileSize(total, theme);
  
  return `${bar} ${usedFormatted}/${totalFormatted} (${percentage.toFixed(1)}%)`;
}

/**
 * Network status indicator
 */
export function networkStatus(
  status: 'online' | 'offline' | 'slow' | 'error',
  latency?: number,
  theme = 'default'
): string {
  const statusIcons = {
    online: emojis.success,
    offline: emojis.error,
    slow: emojis.warning,
    error: emojis.error
  };

  const icon = statusIcons[status];
  const statusText = status.toUpperCase();
  const badge = statusBadge(statusText, status === 'online' ? 'success' : status === 'slow' ? 'warning' : 'error', theme);
  
  let result = `${icon} ${badge}`;
  
  if (latency !== undefined) {
    result += ` ${colorize(`${latency}ms`, resolveColor('muted'), false, theme)}`;
  }
  
  return result;
}

/**
 * Version badge
 */
export function versionBadge(version: string, theme = 'default'): string {
  return statusBadge(`v${version}`, 'info', theme);
}

/**
 * Tag display
 */
export function tag(text: string, color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' = 'primary', theme = 'default'): string {
  return `${colorize('#', resolveColor('muted'), false, theme)}${colorize(text, resolveColor(color))}`;
}

/**
 * Code block formatting
 */
export function codeBlock(code: string, language = '', theme = 'default'): string {
  const width = getTerminalWidth();
  const maxWidth = width - 4;
  
  const lines = code.split('\n').map(line => truncateText(line, maxWidth));
  const maxLineLength = Math.max(...lines.map(line => line.length));
  
  const topBorder = '┌' + '─'.repeat(maxLineLength + 2) + '┐';
  const bottomBorder = '└' + '─'.repeat(maxLineLength + 2) + '┘';
  
  const content = lines.map(line => {
    const paddedLine = line.padEnd(maxLineLength);
    return `│ ${colorize(paddedLine, resolveColor('accent'), false, theme)} │`;
  }).join('\n');

  const langHeader = language ? ` ${colorize(language, resolveColor('muted'), false, theme)}` : '';
  
  return `${colorize(topBorder, resolveColor('muted'), false, theme)}${langHeader}\n${content}\n${colorize(bottomBorder, resolveColor('muted'), false, theme)}`;
}

/**
 * Quote block formatting
 */
export function quoteBlock(text: string, author?: string, theme = 'default'): string {
  const width = getTerminalWidth();
  const maxWidth = width - 6;
  
  const lines = text.split('\n').map(line => truncateText(line, maxWidth));
  const maxLineLength = Math.max(...lines.map(line => line.length));
  
  const content = lines.map(line => {
    const paddedLine = line.padEnd(maxLineLength);
    return `  ${colorize(paddedLine, resolveColor('muted'), false, theme)}`;
  }).join('\n');

  let result = content;
  
  if (author) {
    result += `\n  ${colorize(`— ${author}`, resolveColor('primary'), false, theme)}`;
  }
  
  return result;
}

/**
 * Highlight text with background color
 */
export function highlightText(text: string, color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' = 'primary', theme = 'default'): string {
  if (!supportsColors()) return text;
  
  const themeColors = getThemeInfo(theme)?.colors || themes.default.colors;
  const bgColor = themeColors[color];
  
  // Convert hex to RGB for background
  if (bgColor.startsWith('#')) {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    return `${colors.rgb.bg(r, g, b)}${colors.rgb.fg(255, 255, 255)}${text}${colors.reset}`;
  }
  
  return `${colors.bg[bgColor as keyof typeof colors.bg]}${colors.fg.white}${text}${colors.reset}`;
}

/**
 * Diff indicators for text comparison
 */
export function diffIndicator(
  original: string,
  modified: string,
  theme = 'default'
): string {
  const addPrefix = colorize('+', resolveColor('success'), false, theme);
  const removePrefix = colorize('-', resolveColor('error'), false, theme);
  
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  const result: string[] = [];
  
  // Simple line-by-line comparison
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const modifiedLine = modifiedLines[i] || '';
    
    if (originalLine !== modifiedLine) {
      if (originalLine) {
        result.push(`${removePrefix} ${colorize(originalLine, resolveColor('error'), false, theme)}`);
      }
      if (modifiedLine) {
        result.push(`${addPrefix} ${colorize(modifiedLine, resolveColor('success'), false, theme)}`);
      }
    } else {
      result.push(`  ${originalLine}`);
    }
  }
  
  return result.join('\n');
}

/**
 * Health check status display
 */
export function healthCheck(
  checks: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    message?: string;
    responseTime?: number;
  }>,
  theme = 'default'
): string {
  const statusIcons = {
    healthy: emojis.success,
    warning: emojis.warning,
    error: emojis.error,
    unknown: emojis.question
  };

  const statusColors = {
    healthy: 'success',
    warning: 'warning',
    error: 'error',
    unknown: 'muted'
  };

  const results = checks.map(check => {
    const icon = statusIcons[check.status];
    const color = statusColors[check.status];
    const statusText = check.status.toUpperCase();
    const badge = statusBadge(statusText, check.status === 'healthy' ? 'success' : check.status === 'warning' ? 'warning' : 'error', theme);
    
    let result = `${icon} ${colorize(check.name, resolveColor('secondary'), false, theme)} ${badge}`;
    
    if (check.responseTime !== undefined) {
      result += ` ${colorize(`${check.responseTime}ms`, resolveColor('muted'), false, theme)}`;
    }
    
    if (check.message) {
      result += ` ${colorize(`(${check.message})`, resolveColor('muted'), false, theme)}`;
    }
    
    return result;
  });

  return results.join('\n');
}

/**
 * Performance metrics display
 */
export function performanceMetrics(
  metrics: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
    responseTime?: number;
  },
  theme = 'default'
): string {
  const items: string[] = [];
  
  if (metrics.cpu !== undefined) {
    items.push(`CPU: ${colorize(`${metrics.cpu.toFixed(1)}%`, resolveColor('primary'), false, theme)}`);
  }
  
  if (metrics.memory !== undefined) {
    items.push(`Memory: ${colorize(`${metrics.memory.toFixed(1)}%`, resolveColor('secondary'), false, theme)}`);
  }
  
  if (metrics.disk !== undefined) {
    items.push(`Disk: ${colorize(`${metrics.disk.toFixed(1)}%`, resolveColor('info'), false, theme)}`);
  }
  
  if (metrics.network !== undefined) {
    items.push(`Network: ${colorize(`${metrics.network.toFixed(1)}%`, resolveColor('warning'), false, theme)}`);
  }
  
  if (metrics.responseTime !== undefined) {
    items.push(`Response: ${colorize(`${metrics.responseTime}ms`, resolveColor('success'), false, theme)}`);
  }
  
  return items.join(' | ');
}

/**
 * Configuration summary with advanced formatting
 */
export function configSummaryAdvanced(
  config: {
    name: string;
    version: string;
    environment: string;
    services: Array<{
      name: string;
      status: 'enabled' | 'disabled' | 'warning' | 'error';
      version?: string;
      config?: any;
    }>;
    features: Array<{
      name: string;
      enabled: boolean;
      description?: string;
    }>;
    settings: Record<string, any>;
  },
  theme = 'default'
): string {
  const sections: string[] = [];
  
  // Header
  sections.push(sectionHeader(`${config.name} Configuration`, emojis.gear, theme));
  
  // Basic info
  sections.push(
    keyValue('Version', versionBadge(config.version, theme), theme),
    keyValue('Environment', statusBadge(config.environment, config.environment === 'production' ? 'success' : 'warning', theme), theme)
  );
  
  // Services
  if (config.services.length > 0) {
    sections.push(subsectionHeader('Services', emojis.server, theme));
    config.services.forEach(service => {
      const statusBadgeText = statusBadge(service.status, service.status === 'enabled' ? 'success' : service.status === 'warning' ? 'warning' : 'error', theme);
      let serviceInfo = `${service.name} ${statusBadgeText}`;
      if (service.version) {
        serviceInfo += ` ${versionBadge(service.version, theme)}`;
      }
      sections.push(listItem(serviceInfo, '•', theme));
    });
  }
  
  // Features
  if (config.features.length > 0) {
    sections.push(subsectionHeader('Features', emojis.star, theme));
    config.features.forEach(feature => {
      const status = feature.enabled ? 'success' : 'neutral';
      const statusText = feature.enabled ? 'ENABLED' : 'DISABLED';
      const featureInfo = `${feature.name} ${statusBadge(statusText, status, theme)}`;
      sections.push(listItem(featureInfo, '•', theme));
      if (feature.description) {
        sections.push(listItem(colorize(feature.description, resolveColor('muted'), false, theme), '  ', theme));
      }
    });
  }
  
  // Settings summary
  if (Object.keys(config.settings).length > 0) {
    sections.push(subsectionHeader('Settings', emojis.settings, theme));
    Object.entries(config.settings).forEach(([key, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      sections.push(keyValue(key, displayValue, theme));
    });
  }
  
  return sections.join('\n\n');
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export {
  colors,
  emojis,
  serviceEmojis,
  themes,
  animations,
}; 
/**
 * Terminal formatting utilities for ElizaOS
 * Provides pretty colors, emojis, and styled output
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
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
  
  // Background colors
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

// Emojis for different service types
const emojis = {
  bitcoin: '₿',
  stock: '📈',
  crypto: '🪙',
  etf: '📊',
  nft: '🖼️',
  lifestyle: '🏠',
  travel: '✈️',
  weather: '🌤️',
  food: '🍽️',
  drink: '🍷',
  news: '📰',
  alert: '🚨',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  loading: '⏳',
  rocket: '🚀',
  brain: '🧠',
  heart: '❤️',
  star: '⭐',
  check: '✓',
  cross: '✗',
  arrow: '→',
  sparkles: '✨',
  fire: '🔥',
  money: '💰',
  chart: '📊',
  gear: '⚙️',
  shield: '🛡️',
  lightning: '⚡',
  crown: '👑',
  diamond: '💎',
  trophy: '🏆',
  medal: '🥇',
  flag: '🏁',
  target: '🎯',
  compass: '🧭',
  map: '🗺️',
  clock: '🕐',
  calendar: '📅',
  bell: '🔔',
  megaphone: '📢',
  satellite: '🛰️',
  network: '🌐',
  database: '🗄️',
  cache: '💾',
  api: '🔌',
  webhook: '🔗',
  socket: '🔌',
  server: '🖥️',
  cloud: '☁️',
  lock: '🔒',
  key: '🔑',
  user: '👤',
  team: '👥',
  config: '⚙️',
  settings: '🔧',
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
  backup: '💾',
  restore: '📥',
  import: '📥',
  export: '📤',
  download: '⬇️',
  upload: '⬆️',
  search: '🔍',
  filter: '🔍',
  sort: '📊',
  group: '📁',
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
  equal: '=',
  greater: '>',
  less: '<',
  infinity: '∞',
  percent: '%',
  dollar: '$',
  euro: '€',
  pound: '£',
  yen: '¥',
  integration: '🔗',
  hotel: '🏨',
  bitcoin_symbol: '₿',
  ethereum_symbol: 'Ξ',
  solana_symbol: '◎',
  cardano_symbol: '₳',
  polkadot_symbol: 'DOT',
  chainlink_symbol: 'LINK',
  polygon_symbol: 'MATIC',
  avalanche_symbol: 'AVAX',
  cosmos_symbol: 'ATOM',
  algorand_symbol: 'ALGO',
  stellar_symbol: 'XLM',
  ripple_symbol: 'XRP',
  litecoin_symbol: 'Ł',
  monero_symbol: 'ɱ',
  zcash_symbol: 'ZEC',
  dash_symbol: 'Ð',
  dogecoin_symbol: 'Ð',
  shiba_symbol: 'SHIB',
  usdt_symbol: 'USDT',
  usdc_symbol: 'USDC',
  dai_symbol: 'DAI',
  busd_symbol: 'BUSD',
  tether_symbol: 'USDT',
  circle_symbol: 'USDC',
  maker_symbol: 'MKR',
  compound_symbol: 'COMP',
  aave_symbol: 'AAVE',
  uniswap_symbol: 'UNI',
  sushi_symbol: 'SUSHI',
  curve_symbol: 'CRV',
  yearn_symbol: 'YFI',
  balancer_symbol: 'BAL',
  synthetix_symbol: 'SNX',
  chainlink_symbol_alt: 'LINK',
  polygon_symbol_alt: 'MATIC',
  avalanche_symbol_alt: 'AVAX',
  cosmos_symbol_alt: 'ATOM',
  algorand_symbol_alt: 'ALGO',
  stellar_symbol_alt: 'XLM',
  ripple_symbol_alt: 'XRP',
  litecoin_symbol_alt: 'LTC',
  monero_symbol_alt: 'XMR',
  zcash_symbol_alt: 'ZEC',
  dash_symbol_alt: 'DASH',
  dogecoin_symbol_alt: 'DOGE',
  shiba_symbol_alt: 'SHIB',
  usdt_symbol_alt: 'USDT',
  usdc_symbol_alt: 'USDC',
  dai_symbol_alt: 'DAI',
  busd_symbol_alt: 'BUSD',
  tether_symbol_alt: 'USDT',
  circle_symbol_alt: 'USDC',
  maker_symbol_alt: 'MKR',
  compound_symbol_alt: 'COMP',
  aave_symbol_alt: 'AAVE',
  uniswap_symbol_alt: 'UNI',
  sushi_symbol_alt: 'SUSHI',
  curve_symbol_alt: 'CRV',
  yearn_symbol_alt: 'YFI',
  balancer_symbol_alt: 'BAL',
  synthetix_symbol_alt: 'SNX',
};

// Service-specific emojis
const serviceEmojis = {
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
  default: emojis.gear,
};

/**
 * Format text with colors
 */
export function colorize(text: string, color: keyof typeof colors.fg | keyof typeof colors.bg | 'dim', isBackground = false): string {
  if (color === 'dim') {
    return `${colors.dim}${text}${colors.reset}`;
  }
  const colorCode = isBackground ? colors.bg[color] : colors.fg[color];
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Make text bold
 */
export function bold(text: string): string {
  return `${colors.bright}${text}${colors.reset}`;
}

/**
 * Make text dim
 */
export function dim(text: string): string {
  return `${colors.dim}${text}${colors.reset}`;
}

/**
 * Underline text
 */
export function underline(text: string): string {
  return `${colors.underscore}${text}${colors.reset}`;
}

/**
 * Create a success message
 */
export function success(text: string): string {
  return `${emojis.success} ${colorize(text, 'green')}`;
}

/**
 * Create a warning message
 */
export function warning(text: string): string {
  return `${emojis.warning} ${colorize(text, 'yellow')}`;
}

/**
 * Create an error message
 */
export function error(text: string): string {
  return `${emojis.error} ${colorize(text, 'red')}`;
}

/**
 * Create an info message
 */
export function info(text: string): string {
  return `${emojis.info} ${colorize(text, 'blue')}`;
}

/**
 * Create a loading message
 */
export function loading(text: string): string {
  return `${emojis.loading} ${colorize(text, 'cyan')}`;
}

/**
 * Create a service status message
 */
export function serviceStatus(serviceName: string, status: 'enabled' | 'disabled' | 'starting' | 'started' | 'stopped' | 'error'): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  
  switch (status) {
    case 'enabled':
    case 'started':
      return `${emoji} ${colorize(serviceName, 'green')} ${emojis.success}`;
    case 'starting':
      return `${emoji} ${colorize(serviceName, 'yellow')} ${emojis.loading}`;
    case 'disabled':
    case 'stopped':
      return `${emoji} ${colorize(serviceName, 'dim')} ${emojis.cross}`;
    case 'error':
      return `${emoji} ${colorize(serviceName, 'red')} ${emojis.error}`;
    default:
      return `${emoji} ${serviceName}`;
  }
}

/**
 * Create a configuration summary
 */
export function configSummary(data: {
  servicesEnabled: number;
  servicesDisabled: number;
  enabledServices: string[];
  globalConfig?: any;
}): string {
  const lines = [
    `${emojis.config} ${bold('Configuration Summary')}`,
    '',
    `${emojis.check} ${colorize(`${data.servicesEnabled} services enabled`, 'green')}`,
    `${emojis.cross} ${colorize(`${data.servicesDisabled} services disabled`, 'red')}`,
    '',
    `${emojis.gear} ${bold('Enabled Services:')}`,
    ...data.enabledServices.map(service => 
      `  ${serviceStatus(service, 'enabled')}`
    ),
    ''
  ];

  if (data.globalConfig) {
    lines.push(`${emojis.settings} ${bold('Global Configuration:')}`);
    Object.entries(data.globalConfig).forEach(([key, value]) => {
      lines.push(`  ${colorize(key, 'cyan')}: ${value}`);
    });
  }

  return lines.join('\n');
}

/**
 * Create a startup banner
 */
export function startupBanner(): string {
  return `
${colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan')}
${colorize('║', 'cyan')}                    ${bold(colorize('ElizaOS Bitcoin LTL Agent', 'magenta'))}                    ${colorize('║', 'cyan')}
${colorize('║', 'cyan')}              ${colorize('Live The Life You Deserve', 'dim')}              ${colorize('║', 'cyan')}
${colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan')}
${emojis.rocket} ${colorize('Initializing services...', 'yellow')}
`;
}

/**
 * Create a service startup message
 */
export function serviceStartup(serviceName: string): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  return `${emoji} ${colorize(`${serviceName} starting...`, 'yellow')}`;
}

/**
 * Create a service started message
 */
export function serviceStarted(serviceName: string): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  return `${emoji} ${colorize(`${serviceName} started successfully`, 'green')}`;
}

/**
 * Create a service error message
 */
export function serviceError(serviceName: string, error: string): string {
  const emoji = serviceEmojis[serviceName as keyof typeof serviceEmojis] || serviceEmojis.default;
  return `${emoji} ${colorize(`${serviceName} error:`, 'red')} ${error}`;
}

/**
 * Create a progress bar
 */
export function progressBar(current: number, total: number, width = 20): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const filledBar = colorize('█'.repeat(filled), 'green');
  const emptyBar = colorize('░'.repeat(empty), 'dim');
  
  return `${filledBar}${emptyBar} ${percentage}%`;
}

/**
 * Create a table header
 */
export function tableHeader(headers: string[]): string {
  const headerRow = headers.map(header => bold(colorize(header, 'cyan'))).join(' | ');
  const separator = headers.map(() => '─'.repeat(10)).join('─┼─');
  return `${headerRow}\n${separator}`;
}

/**
 * Create a table row
 */
export function tableRow(cells: string[]): string {
  return cells.join(' | ');
}

/**
 * Create a divider
 */
export function divider(char = '─', length = 60): string {
  return colorize(char.repeat(length), 'dim');
}

/**
 * Create a section header
 */
export function sectionHeader(title: string, emoji = emojis.star): string {
  return `\n${emoji} ${bold(colorize(title, 'magenta'))}\n${divider()}`;
}

/**
 * Create a subsection header
 */
export function subsectionHeader(title: string, emoji = emojis.arrow): string {
  return `${emoji} ${colorize(title, 'cyan')}`;
}

/**
 * Format a number with color based on value
 */
export function formatNumber(value: number, decimals = 2): string {
  const formatted = value.toFixed(decimals);
  if (value > 0) {
    return colorize(`+${formatted}`, 'green');
  } else if (value < 0) {
    return colorize(formatted, 'red');
  }
  return colorize(formatted, 'dim');
}

/**
 * Format a percentage with color
 */
export function formatPercentage(value: number): string {
  return formatNumber(value, 2) + '%';
}

/**
 * Format a price with currency symbol
 */
export function formatPrice(value: number, currency = '$'): string {
  return colorize(`${currency}${value.toLocaleString()}`, 'yellow');
}

/**
 * Create a status indicator
 */
export function statusIndicator(status: 'online' | 'offline' | 'warning' | 'error'): string {
  switch (status) {
    case 'online':
      return colorize('●', 'green');
    case 'offline':
      return colorize('●', 'dim');
    case 'warning':
      return colorize('●', 'yellow');
    case 'error':
      return colorize('●', 'red');
  }
}

/**
 * Create a key-value pair display
 */
export function keyValue(key: string, value: any): string {
  return `${colorize(key, 'cyan')}: ${value}`;
}

/**
 * Create a list item
 */
export function listItem(text: string, bullet = '•'): string {
  return `${colorize(bullet, 'green')} ${text}`;
}

/**
 * Create a numbered list item
 */
export function numberedItem(index: number, text: string): string {
  return `${colorize(`${index}.`, 'cyan')} ${text}`;
} 
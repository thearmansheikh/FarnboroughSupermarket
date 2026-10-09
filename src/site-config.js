const DEFAULT_CONFIG = {
  DOMAIN: 'http://localhost:3000',
  LEGAL_NAME: 'Farnborough Supermarket',
  FORMSUBMIT_ALIAS: '',
  FACEBOOK_URL: 'https://www.facebook.com/share/1JGNKZoFTJ/?mibextid=wwXIfr',
  HALAL_CERTIFIER: '',
};

// Files whose text content may contain {{PLACEHOLDER}} values.
const TEMPLATED_EXTENSIONS = ['.html', '.xml', '.txt', '.webmanifest'];

// Vercel exposes the production hostname at build time; use it when SITE_URL is unset.
function vercelProductionUrl(env) {
  return env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
}

function resolveSiteConfig(overrides = {}) {
  const env = { ...process.env, ...overrides };

  return {
    DOMAIN: (env.SITE_URL || env.DOMAIN || vercelProductionUrl(env) || DEFAULT_CONFIG.DOMAIN || '').replace(/\/$/, ''),
    LEGAL_NAME: env.LEGAL_NAME || DEFAULT_CONFIG.LEGAL_NAME,
    FORMSUBMIT_ALIAS: env.FORMSUBMIT_ALIAS || DEFAULT_CONFIG.FORMSUBMIT_ALIAS,
    FACEBOOK_URL: env.FACEBOOK_URL || DEFAULT_CONFIG.FACEBOOK_URL,
    HALAL_CERTIFIER: env.HALAL_CERTIFIER || DEFAULT_CONFIG.HALAL_CERTIFIER,
  };
}

function applySiteTemplate(content, config = resolveSiteConfig()) {
  const values = { ...DEFAULT_CONFIG, ...config };
  let output = String(content);

  for (const [key, value] of Object.entries(values)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    output = output.replace(placeholder, value ?? '');
  }

  return output;
}

module.exports = {
  DEFAULT_CONFIG,
  TEMPLATED_EXTENSIONS,
  resolveSiteConfig,
  applySiteTemplate,
};

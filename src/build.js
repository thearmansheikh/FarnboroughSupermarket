const fs = require('fs');
const path = require('path');
const { resolveSiteConfig, applySiteTemplate, TEMPLATED_EXTENSIONS } = require('./site-config');

const publicDir = path.resolve(__dirname, '..', 'public');
const defaultOutDir = path.resolve(__dirname, '..', 'dist');

// Copies public/ into outDir, substituting {{PLACEHOLDER}} values in text files.
function build(outDir = defaultOutDir, config = resolveSiteConfig()) {
  fs.rmSync(outDir, { recursive: true, force: true });

  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(from, to);
      } else if (TEMPLATED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        fs.writeFileSync(to, applySiteTemplate(fs.readFileSync(from, 'utf8'), config));
      } else {
        fs.copyFileSync(from, to);
      }
    }
  };

  copyDir(publicDir, outDir);
  return config;
}

if (require.main === module) {
  const config = build();
  console.log(`Built site for ${config.DOMAIN} into dist/`);

  if (!config.FORMSUBMIT_ALIAS) {
    console.warn('Warning: FORMSUBMIT_ALIAS is not set, so the contact form will not send enquiries.');
  }
}

module.exports = { build };

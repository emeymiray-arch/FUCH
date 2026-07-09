const { execSync } = require('child_process');

function getBuildId() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  }
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }
  if (process.env.EXPO_PUBLIC_BUILD_ID) {
    return process.env.EXPO_PUBLIC_BUILD_ID;
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    buildId: getBuildId(),
  },
});

var appConfig = {
  pluginService: {
    // set to /plugins.json for local dev
    // set to /plugins.local.build.json for testing your build
    // set to "" for the default live plugin loader
    url: '/plugins.json',
  },
  sso: {
    accountSid: '' // Set to login via your configured SSO provider automatically
  },
  logLevel: 'debug',
};

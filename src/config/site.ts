// TODO: replace '#' with verified official URLs before public launch.
export const siteConfig = {
  forumUrl: '/forum', shopUrl: '#', accountUrl: '/account', launcherUrl: '#',
  discordUrl: '#', telegramUrl: '#',
  trailerUrl: '#', rulesUrl: '/rules?rev=2', termsUrl: '/terms?rev=2', privacyUrl: '/privacy?rev=2',
  serverApiUrl: '/api/server-status', playersApiUrl: '/api/players', authApiUrl: '/api/auth-login', serverAddress: '94.23.168.153:22097',
  serverRefreshMs: 60000, newsApiUrl: '/api/site-news', useMockNews: false,
};
export type LinkKey = keyof typeof siteConfig;

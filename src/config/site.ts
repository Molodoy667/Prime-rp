// TODO: replace '#' with verified official URLs before public launch.
export const siteConfig = {
  forumUrl: '/forum', shopUrl: '#', accountUrl: '#', launcherUrl: '#',
  discordUrl: '#', telegramUrl: '#',
  trailerUrl: '#', rulesUrl: '/rules?rev=2', termsUrl: '/terms?rev=2', privacyUrl: '/privacy?rev=2',
  serverApiUrl: '/api/server-status', serverAddress: '94.23.168.153:22097',
  serverRefreshMs: 60000, newsApiUrl: '', useMockNews: true,
};
export type LinkKey = keyof typeof siteConfig;

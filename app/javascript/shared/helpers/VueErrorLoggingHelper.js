import * as Sentry from '@sentry/vue';

const DENY_URLS = [
  // Chrome extensions
  /^chrome:\/\//i,
  /chrome-extension:/i,
  /extensions\//i,

  // Locally saved copies
  /file:\/\//i,

  // Safari extensions
  /safari-web-extension:/i,
  /safari-extension:/i,
];

const IGNORE_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications',
];

export const initializeVueErrorLogging = ({ app, router }) => {
  if (!window.errorLoggingConfig) {
    return;
  }

  Sentry.init({
    app,
    dsn: window.errorLoggingConfig,
    denyUrls: DENY_URLS,
    integrations: [Sentry.browserTracingIntegration({ router })],
    ignoreErrors: IGNORE_ERRORS,
  });
};

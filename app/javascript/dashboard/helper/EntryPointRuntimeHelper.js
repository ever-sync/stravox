import {
  initializeAnalyticsEvents,
  initializeStravoXEvents,
} from './scriptHelpers';

export const initializeDashboardRuntime = ({ initializeRouter }) => {
  initializeStravoXEvents();
  initializeAnalyticsEvents();
  initializeRouter();
};

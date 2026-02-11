import { frontendURL } from '../../../helper/URLHelper';

const DashboardView = () => import('./DashboardView.vue');

export const routes = [
  {
    path: frontendURL('accounts/:accountId/overview'),
    name: 'overview_dashboard',
    meta: {
      permissions: ['administrator', 'agent'],
    },
    component: DashboardView,
  },
];

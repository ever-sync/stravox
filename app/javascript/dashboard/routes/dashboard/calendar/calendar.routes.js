import { frontendURL } from '../../../helper/URLHelper';
  const CalendarView = () => import('./CalendarView.vue');
  
  export const routes = [
    {
      path: frontendURL('accounts/:accountId/calendar'),
      name: 'calendar_view',
      meta: {
        permissions: ['administrator', 'agent'],
      },
      component: CalendarView,
    },
  ];
  

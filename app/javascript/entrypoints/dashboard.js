import { createApp } from 'vue';
import App from 'dashboard/App.vue';
import i18nMessages from 'dashboard/i18n';
import {
  setupDashboardApp,
  setupDashboardGlobals,
} from 'dashboard/helper/AppBootstrapHelper';
import { initializeDashboardRuntime } from 'dashboard/helper/EntryPointRuntimeHelper';
import { sync } from 'vuex-router-sync';
import { createPinia } from 'pinia';
import router, { initalizeRouter } from 'dashboard/routes';
import store from 'dashboard/store';
import { mountVueAppOnLoad } from 'shared/helpers/VueEntryPointHelper';
import { initializeVueErrorLogging } from 'shared/helpers/VueErrorLoggingHelper';
import { createVueI18n } from 'shared/helpers/VueI18nHelper';

import 'floating-vue/dist/style.css';

const i18n = createVueI18n({
  legacy: false, // https://github.com/intlify/vue-i18n/issues/1902
  locale: 'en',
  messages: i18nMessages,
});

sync(store, router);

const pinia = createPinia();

const app = createApp(App);
setupDashboardApp({ app, i18n, store, pinia, router });

// [VITE] Disabled this, need to renable later
initializeVueErrorLogging({ app, router });

// load common helpers into js
setupDashboardGlobals();
// [VITE] Disabled this we don't need it, we can use `useEmitter` directly
// app.prototype.$emitter = emitter;

initializeDashboardRuntime({ initializeRouter: initalizeRouter });
mountVueAppOnLoad({ app });

import { createApp } from 'vue';
import i18nMessages from 'dashboard/i18n';
import { initializeDashboardRuntime } from 'dashboard/helper/EntryPointRuntimeHelper';
import { mountVueAppOnLoad } from 'shared/helpers/VueEntryPointHelper';
import { initializeVueErrorLogging } from 'shared/helpers/VueErrorLoggingHelper';
import { createVueI18n } from 'shared/helpers/VueI18nHelper';
import App from '../v3/App.vue';
import router, { initalizeRouter } from '../v3/views/index';
import store from '../v3/store';
import FluentIcon from 'shared/components/FluentIcon/DashboardIcon.vue';
// import { emitter } from '../shared/helpers/mitt';

// [VITE] This was added in https://github.com/stravox/stravox/commit/b57063a8b83c86819bd285f481298d7cd38ad50e
// Commenting it out for Vite migration
// Vue.config.env = process.env;

const i18n = createVueI18n({
  legacy: false, // https://github.com/intlify/vue-i18n/issues/1902
  locale: 'en',
  messages: i18nMessages,
});

const app = createApp(App);
app.use(i18n);
app.use(store);
app.use(router);

// Vue.use(VueRouter);
// Vue.use(VueI18n);
// Vue.prototype.$emitter = emitter;
app.component('fluent-icon', FluentIcon);

initializeVueErrorLogging({ app, router });

initializeDashboardRuntime({ initializeRouter: initalizeRouter });
mountVueAppOnLoad({ app });

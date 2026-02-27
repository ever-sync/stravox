import { createApp } from 'vue';
import store from '../survey/store';
import i18nMessages from '../survey/i18n';
import App from '../survey/App.vue';
import { mountVueAppOnLoad } from 'shared/helpers/VueEntryPointHelper';
import { createVueI18n } from 'shared/helpers/VueI18nHelper';

const app = createApp(App);
const i18n = createVueI18n({
  locale: 'en',
  messages: i18nMessages,
});

app.use(i18n);
app.use(store);

mountVueAppOnLoad({
  app,
  onMounted: mountedApp => {
    window.WOOT_SURVEY = mountedApp;
  },
});

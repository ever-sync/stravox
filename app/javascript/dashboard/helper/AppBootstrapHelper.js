import axios from 'axios';
import hljsVuePlugin from '@highlightjs/vue-plugin';
import Multiselect from 'vue-multiselect';
import { plugin, defaultConfig } from '@formkit/vue';
import FloatingVue from 'floating-vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import { vResizeObserver } from '@vueuse/components';
import { directive as onClickaway } from 'vue3-click-away';

import WootWizard from 'components/ui/Wizard.vue';
import WootUiKit from 'dashboard/components';
import createAxios from 'dashboard/helper/APIHelper';
import commonHelpers, { isJSONValid } from 'dashboard/helper/commons';
import constants from 'dashboard/constants/globals';
import FluentIcon from 'shared/components/FluentIcon/DashboardIcon.vue';
import { domPurifyConfig } from 'shared/helpers/HTMLSanitizer.js';

export const setupDashboardApp = ({ app, i18n, store, pinia, router }) => {
  app.use(i18n);
  app.use(store);
  app.use(pinia);
  app.use(router);

  app.use(VueDOMPurifyHTML, domPurifyConfig);
  app.use(WootUiKit);
  app.use(
    plugin,
    defaultConfig({
      rules: {
        JSON: ({ value }) => isJSONValid(value),
      },
    })
  );
  app.use(FloatingVue, {
    instantMove: true,
    arrowOverflow: false,
    disposeTimeout: 5000000,
  });
  app.use(hljsVuePlugin);

  app.component('multiselect', Multiselect);
  app.component('woot-wizard', WootWizard);
  app.component('fluent-icon', FluentIcon);

  app.directive('resize', vResizeObserver);
  app.directive('on-clickaway', onClickaway);
};

export const setupDashboardGlobals = () => {
  commonHelpers();
  window.WootConstants = constants;
  window.axios = createAxios(axios);
};

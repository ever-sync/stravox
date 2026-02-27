import { createI18n } from 'vue-i18n';

export const createVueI18n = ({ messages, locale = 'en', legacy }) => {
  const options = { locale, messages };

  if (typeof legacy !== 'undefined') {
    options.legacy = legacy;
  }

  return createI18n(options);
};

<script>
// utils and composables
import { login } from '../../api/auth';
import { mapGetters } from 'vuex';
import { useAlert } from 'dashboard/composables';
import { required, email } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { SESSION_STORAGE_KEYS } from 'dashboard/constants/sessionStorage';
import SessionStorage from 'shared/helpers/sessionStorage';
import { useBranding } from 'shared/composables/useBranding';

// components
import SimpleDivider from '../../components/Divider/SimpleDivider.vue';
import FormInput from '../../components/Form/Input.vue';
import GoogleOAuthButton from '../../components/GoogleOauth/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import MfaVerification from 'dashboard/components/auth/MfaVerification.vue';

const ERROR_MESSAGES = {
  'no-account-found': 'LOGIN.OAUTH.NO_ACCOUNT_FOUND',
  'business-account-only': 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY',
  'saml-authentication-failed': 'LOGIN.SAML.API.ERROR_MESSAGE',
  'saml-not-enabled': 'LOGIN.SAML.API.ERROR_MESSAGE',
};

const IMPERSONATION_URL_SEARCH_KEY = 'impersonation';

export default {
  components: {
    FormInput,
    GoogleOAuthButton,
    Spinner,
    NextButton,
    SimpleDivider,
    MfaVerification,
    Icon,
  },
  props: {
    ssoAuthToken: { type: String, default: '' },
    ssoAccountId: { type: String, default: '' },
    ssoConversationId: { type: String, default: '' },
    email: { type: String, default: '' },
    authError: { type: String, default: '' },
  },
  setup() {
    const { replaceInstallationName } = useBranding();
    return {
      replaceInstallationName,
      v$: useVuelidate(),
    };
  },
  data() {
    return {
      // We need to initialize the component with any
      // properties that will be used in it
      credentials: {
        email: '',
        password: '',
      },
      loginApi: {
        message: '',
        showLoading: false,
        hasErrored: false,
      },
      error: '',
      mfaRequired: false,
      mfaToken: null,
    };
  },
  validations() {
    return {
      credentials: {
        password: {
          required,
        },
        email: {
          required,
          email,
        },
      },
    };
  },
  computed: {
    ...mapGetters({ globalConfig: 'globalConfig/get' }),
    allowedLoginMethods() {
      return window.stravoxConfig.allowedLoginMethods || ['email'];
    },
    showGoogleOAuth() {
      return (
        this.allowedLoginMethods.includes('google_oauth') &&
        Boolean(window.stravoxConfig.googleOAuthClientId)
      );
    },
    showSignupLink() {
      return window.stravoxConfig.signupEnabled === 'true';
    },
    showSamlLogin() {
      return this.allowedLoginMethods.includes('saml');
    },
  },
  created() {
    if (this.ssoAuthToken) {
      this.submitLogin();
    }
    if (this.authError) {
      const messageKey = ERROR_MESSAGES[this.authError] ?? 'LOGIN.API.UNAUTH';
      // Use a method to get the translated text to avoid dynamic key warning
      const translatedMessage = this.getTranslatedMessage(messageKey);
      useAlert(translatedMessage);
      // wait for idle state
      this.requestIdleCallbackPolyfill(() => {
        // Remove the error query param from the url
        const { query } = this.$route;
        this.$router.replace({ query: { ...query, error: undefined } });
      });
    }
  },
  methods: {
    getTranslatedMessage(key) {
      // Avoid dynamic key warning by handling each case explicitly
      switch (key) {
        case 'LOGIN.OAUTH.NO_ACCOUNT_FOUND':
          return this.$t('LOGIN.OAUTH.NO_ACCOUNT_FOUND');
        case 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY':
          return this.$t('LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY');
        case 'LOGIN.API.UNAUTH':
        default:
          return this.$t('LOGIN.API.UNAUTH');
      }
    },
    // TODO: Remove this when Safari gets wider support
    // Ref: https://caniuse.com/requestidlecallback
    //
    requestIdleCallbackPolyfill(callback) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback);
      } else {
        // Fallback for safari
        // Using a delay of 0 allows the callback to be executed asynchronously
        // in the next available event loop iteration, similar to requestIdleCallback
        setTimeout(callback, 0);
      }
    },
    showAlertMessage(message) {
      // Reset loading, current selected agent
      this.loginApi.showLoading = false;
      this.loginApi.message = message;
      useAlert(this.loginApi.message);
    },
    safeDecodeURI(uri) {
      try {
        return decodeURIComponent(uri);
      } catch {
        return uri;
      }
    },
    handleImpersonation() {
      // Detects impersonation mode via URL and sets a session flag to prevent user settings changes during impersonation.
      const urlParams = new URLSearchParams(window.location.search);
      const impersonation = urlParams.get(IMPERSONATION_URL_SEARCH_KEY);
      if (impersonation === 'true') {
        SessionStorage.set(SESSION_STORAGE_KEYS.IMPERSONATION_USER, true);
      }
    },
    submitLogin() {
      this.loginApi.hasErrored = false;
      this.loginApi.showLoading = true;

      const credentials = {
        email: this.email
          ? this.safeDecodeURI(this.email)
          : this.credentials.email,
        password: this.credentials.password,
        sso_auth_token: this.ssoAuthToken,
        ssoAccountId: this.ssoAccountId,
        ssoConversationId: this.ssoConversationId,
      };

      login(credentials)
        .then(result => {
          // Check if MFA is required
          if (result?.mfaRequired) {
            this.loginApi.showLoading = false;
            this.mfaRequired = true;
            this.mfaToken = result.mfaToken;
            return;
          }

          this.handleImpersonation();
          this.showAlertMessage(this.$t('LOGIN.API.SUCCESS_MESSAGE'));
        })
        .catch(response => {
          // Reset URL Params if the authentication is invalid
          if (this.email) {
            window.location = '/app/login';
          }
          this.loginApi.hasErrored = true;
          this.showAlertMessage(
            response?.message || this.$t('LOGIN.API.UNAUTH')
          );
        });
    },
    submitFormLogin() {
      if (this.v$.credentials.email.$invalid && !this.email) {
        this.showAlertMessage(this.$t('LOGIN.EMAIL.ERROR'));
        return;
      }

      this.submitLogin();
    },
    handleMfaVerified() {
      // MFA verification successful, continue with login
      this.handleImpersonation();
      window.location = '/app';
    },
    handleMfaCancel() {
      // User cancelled MFA, reset state
      this.mfaRequired = false;
      this.mfaToken = null;
      this.credentials.password = '';
    },
  },
};
</script>

<template>
  <main class="flex min-h-screen bg-n-slate-1">
    <!-- Left Panel - Testimonial with woman image -->
    <section
      class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-500 to-indigo-400"
    >
      <!-- Woman background image -->
      <img
        src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80&auto=format&fit=crop"
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay opacity-40"
      />
      <!-- Dark gradient overlay for text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-indigo-900/30 to-transparent" />

      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-between p-12 w-full h-full">
        <!-- Logo (vortex SVG inline + name) -->
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 bg-white/15 rounded-xl backdrop-blur-md border border-white/20">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="rgba(255,255,255,0.2)"/>
              <path d="M16 4C9.373 4 4 9.373 4 16c0 2.761.935 5.305 2.506 7.328" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M16 8C11.582 8 8 11.582 8 16c0 1.85.63 3.553 1.685 4.907" stroke="rgba(255,255,255,0.8)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
              <path d="M16 12c-2.21 0-4 1.79-4 4c0 .92.312 1.767.836 2.443" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M16 28c6.627 0 12-5.373 12-12c0-2.761-.935-5.305-2.506-7.328" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M16 24c4.418 0 8-3.582 8-8c0-1.85-.63-3.553-1.685-4.907" stroke="rgba(255,255,255,0.8)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
              <path d="M16 20c2.21 0 4-1.79 4-4c0-.92-.312-1.767-.836-2.443" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <circle cx="16" cy="16" r="2" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <span class="text-white font-bold text-xl tracking-tight">{{ globalConfig.installationName }}</span>
        </div>

        <!-- Testimonial Card at bottom -->
        <div class="mt-auto">
          <!-- Quote icon -->
          <div class="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl mb-5 backdrop-blur-md border border-white/10">
            <svg class="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>

          <!-- Quote text -->
          <blockquote class="text-white text-2xl font-medium leading-relaxed mb-8 drop-shadow-lg">
            "{{ $t('LOGIN.TESTIMONIAL.QUOTE') }}"
          </blockquote>

          <!-- Author -->
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-lg backdrop-blur-md border border-white/20">
              {{ $t('LOGIN.TESTIMONIAL.AUTHOR').charAt(0) }}
            </div>
            <div>
              <div class="text-white font-semibold text-base">{{ $t('LOGIN.TESTIMONIAL.AUTHOR') }}</div>
              <div class="text-white/70 text-sm">{{ $t('LOGIN.TESTIMONIAL.ROLE') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Panel - Login Form -->
    <section class="flex-1 flex items-center justify-center p-8 lg:p-12">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="flex items-center justify-center gap-3 mb-8 lg:hidden">
          <div class="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient
                  id="vt-m1"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop
                    offset="0%"
                    stop-color="#7C3AED"
                  />
                  <stop
                    offset="100%"
                    stop-color="#4F46E5"
                  />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="16" fill="url(#vt-m1)"/>
              <path d="M16 4C9.373 4 4 9.373 4 16c0 2.761.935 5.305 2.506 7.328" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
              <path d="M16 8C11.582 8 8 11.582 8 16c0 1.85.63 3.553 1.685 4.907" stroke="#C4B5FD" stroke-width="2.2" stroke-linecap="round" fill="none"/>
              <path d="M16 12c-2.21 0-4 1.79-4 4c0 .92.312 1.767.836 2.443" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M16 28c6.627 0 12-5.373 12-12c0-2.761-.935-5.305-2.506-7.328" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
              <path d="M16 24c4.418 0 8-3.582 8-8c0-1.85-.63-3.553-1.685-4.907" stroke="#C4B5FD" stroke-width="2.2" stroke-linecap="round" fill="none"/>
              <path d="M16 20c2.21 0 4-1.79 4-4c0-.92-.312-1.767-.836-2.443" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <circle cx="16" cy="16" r="2" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <span class="text-n-slate-12 font-bold text-xl tracking-tight">{{ globalConfig.installationName }}</span>
        </div>

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl lg:text-3xl font-bold text-n-slate-12 mb-2">
            {{ replaceInstallationName($t('LOGIN.TITLE')) }}
          </h1>
          <p class="text-n-slate-11">
            {{ $t('LOGIN.SUBTITLE') }}
          </p>
        </div>

        <!-- MFA Verification -->
        <div v-if="mfaRequired">
          <MfaVerification
            :mfa-token="mfaToken"
            @verified="handleMfaVerified"
            @cancel="handleMfaCancel"
          />
        </div>

        <!-- Login Form -->
        <div v-else-if="!email">
          <form class="space-y-5" @submit.prevent="submitFormLogin">
            <FormInput
              v-model="credentials.email"
              name="email_address"
              type="text"
              data-testid="email_input"
              :tabindex="1"
              required
              :label="$t('LOGIN.EMAIL.LABEL')"
              :placeholder="$t('LOGIN.EMAIL.PLACEHOLDER')"
              :has-error="v$.credentials.email.$error"
              class="!bg-slate-50 focus:!bg-white !rounded-xl !border-slate-200 transition-all duration-200"
              @input="v$.credentials.email.$touch"
            />
            <FormInput
              v-model="credentials.password"
              type="password"
              name="password"
              data-testid="password_input"
              required
              :tabindex="2"
              :label="$t('LOGIN.PASSWORD.LABEL')"
              :placeholder="$t('LOGIN.PASSWORD.PLACEHOLDER')"
              :has-error="v$.credentials.password.$error"
              class="!bg-slate-50 focus:!bg-white !rounded-xl !border-slate-200 transition-all duration-200"
              @input="v$.credentials.password.$touch"
            />

            <!-- Forgot password below password field -->
            <div v-if="!globalConfig.disableUserProfileUpdate" class="flex justify-end -mt-2">
              <router-link
                to="auth/reset/password"
                class="text-xs text-n-slate-10 hover:text-indigo-600 transition-colors font-medium"
                tabindex="4"
              >
                {{ $t('LOGIN.FORGOT_PASSWORD') }}
              </router-link>
            </div>

            <div class="pt-1">
              <NextButton
                lg
                type="submit"
                data-testid="submit_button"
                class="w-full !rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !shadow-lg !shadow-indigo-500/20 !border-none !text-base"
                :tabindex="3"
                :label="$t('LOGIN.SUBMIT')"
                :disabled="loginApi.showLoading"
                :is-loading="loginApi.showLoading"
              />
            </div>
          </form>

          <!-- Divider -->
          <div v-if="showGoogleOAuth || showSamlLogin" class="relative my-8">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-n-slate-3"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-n-slate-1 px-3 text-xs uppercase text-n-slate-10 tracking-wider font-medium">{{ $t('COMMON.OR') }}</span>
            </div>
          </div>

          <!-- Social Login -->
          <div class="flex flex-col gap-3">
            <div
              v-if="showGoogleOAuth"
              class="[&>div>a]:!rounded-xl [&>div>a]:!border-n-slate-3 [&>div>a]:!shadow-sm [&>div>a]:hover:!bg-slate-50"
            >
              <GoogleOAuthButton />
            </div>

            <router-link
              v-if="showSamlLogin"
              to="/app/login/sso"
              class="inline-flex justify-center w-full px-4 py-3 items-center bg-white dark:bg-n-solid-2 rounded-xl border border-n-slate-3 dark:border-n-slate-6 hover:bg-slate-50 dark:hover:bg-n-solid-3 transition-colors shadow-sm"
            >
              <Icon
                icon="i-lucide-lock-keyhole"
                class="size-5 text-n-slate-11"
              />
              <span class="ml-2 text-base font-medium text-n-slate-12">
                {{ $t('LOGIN.SAML.LABEL') }}
              </span>
            </router-link>
          </div>

          <!-- Signup Link -->
          <p v-if="showSignupLink" class="mt-8 text-center text-sm text-n-slate-11">
            {{ $t('LOGIN.SIGNUP_QUESTION') }}
            <router-link to="auth/signup" class="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors ml-1">
              {{ $t('LOGIN.CREATE_NEW_ACCOUNT') }}
            </router-link>
          </p>
        </div>

        <!-- SSO Loading -->
        <div v-else class="flex items-center justify-center py-12">
          <Spinner color-scheme="primary" size="" />
        </div>
      </div>
    </section>
  </main>
</template>

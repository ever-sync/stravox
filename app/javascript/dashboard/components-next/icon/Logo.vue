<script setup>
import { useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');
</script>

<template>
  <img
    v-if="globalConfig.logoThumbnail"
    v-bind="attrs"
    :src="globalConfig.logoThumbnail"
  />
  <svg
    v-else
    v-once
    v-bind="attrs"
    width="16"
    height="16"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="vortex-grad-1"
        x1="0"
        y1="0"
        x2="32"
        y2="32"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="#7C3AED" />
        <stop offset="50%" stop-color="#6D28D9" />
        <stop offset="100%" stop-color="#4F46E5" />
      </linearGradient>
      <linearGradient
        id="vortex-grad-2"
        x1="16"
        y1="4"
        x2="16"
        y2="28"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="#A78BFA" />
        <stop offset="100%" stop-color="#818CF8" />
      </linearGradient>
      <linearGradient
        id="vortex-grad-3"
        x1="10"
        y1="8"
        x2="22"
        y2="24"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="#C4B5FD" />
        <stop offset="100%" stop-color="#A78BFA" />
      </linearGradient>
    </defs>
    <!-- Background circle -->
    <circle cx="16" cy="16" r="16" fill="url(#vortex-grad-1)" />
    <!-- Vortex spiral arms -->
    <!-- Outer arm -->
    <path
      d="M16 4C9.373 4 4 9.373 4 16c0 2.761.935 5.305 2.506 7.328"
      stroke="url(#vortex-grad-2)"
      stroke-width="2.5"
      stroke-linecap="round"
      fill="none"
      opacity="0.9"
    />
    <!-- Middle arm -->
    <path
      d="M16 8C11.582 8 8 11.582 8 16c0 1.85.63 3.553 1.685 4.907"
      stroke="url(#vortex-grad-3)"
      stroke-width="2.2"
      stroke-linecap="round"
      fill="none"
      opacity="0.95"
    />
    <!-- Inner arm -->
    <path
      d="M16 12c-2.21 0-4 1.79-4 4c0 .92.312 1.767.836 2.443"
      stroke="white"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
      opacity="0.9"
    />
    <!-- Opposing outer arm -->
    <path
      d="M16 28c6.627 0 12-5.373 12-12c0-2.761-.935-5.305-2.506-7.328"
      stroke="url(#vortex-grad-2)"
      stroke-width="2.5"
      stroke-linecap="round"
      fill="none"
      opacity="0.9"
    />
    <!-- Opposing middle arm -->
    <path
      d="M16 24c4.418 0 8-3.582 8-8c0-1.85-.63-3.553-1.685-4.907"
      stroke="url(#vortex-grad-3)"
      stroke-width="2.2"
      stroke-linecap="round"
      fill="none"
      opacity="0.95"
    />
    <!-- Opposing inner arm -->
    <path
      d="M16 20c2.21 0 4-1.79 4-4c0-.92-.312-1.767-.836-2.443"
      stroke="white"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
      opacity="0.9"
    />
    <!-- Center glow dot -->
    <circle cx="16" cy="16" r="2" fill="white" opacity="0.95" />
    <circle cx="16" cy="16" r="3.5" fill="white" opacity="0.15" />
  </svg>
</template>

export const mountVueAppOnLoad = ({ app, selector = '#app', onMounted }) => {
  window.onload = () => {
    const mountedApp = app.mount(selector);

    if (onMounted) {
      onMounted(mountedApp);
    }
  };
};

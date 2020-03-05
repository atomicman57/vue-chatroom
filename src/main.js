// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import App from "./App";
import router from "./router";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "vue-wysiwyg/dist/vueWysiwyg.css";
import wysiwyg from "vue-wysiwyg";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(wysiwyg, {
  hideModules: {
    // image: true,
    table: true,
    link: true
  },
  maxHeight: "100px"
}); // config is optional. more below

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>"
});

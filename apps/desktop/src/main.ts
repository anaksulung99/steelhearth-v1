import { createApp } from "vue";
import { createPinia } from "pinia";
import { Field as FormField } from "vee-validate";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';


const pinia = createPinia();

const app = createApp(App);
app.component("FormField", FormField);

app
  .use(pinia)
  .use(Vue3Toastify, {
    autoClose: 3000,
    theme: "dark",
    transition: "flip",
    position: "top-right"
  } as ToastContainerOptions,)
  .use(router)
  .mount("#app");
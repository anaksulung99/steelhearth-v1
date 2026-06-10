import { createApp } from "vue";
import { createPinia } from "pinia";
import { Field as FormField } from "vee-validate";
import "./style.css";
import App from "./App.vue";
import router from "./router";


const pinia = createPinia();

const app = createApp(App);
app.component("FormField", FormField);

app.use(pinia)
  .use(router)
  .mount("#app");
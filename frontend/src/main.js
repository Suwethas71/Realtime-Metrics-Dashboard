import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import 'vue-sonner/style.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/drawer.css';
import './styles/dashboard.css';
import './styles/analytics.css';
import './styles/manage.css';
import './styles/detail.css';

createApp(App).use(createPinia()).use(router).mount('#root');

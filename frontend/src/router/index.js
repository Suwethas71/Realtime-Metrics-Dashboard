import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard', sub: 'Live operational metrics across sales, traffic, system and revenue.' }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('../views/AnalyticsView.vue'),
    meta: { title: 'Analytics', sub: 'Breakdowns and changes recorded since this page opened.' }
  },
  {
    path: '/manage',
    name: 'manage',
    component: () => import('../views/ManageView.vue'),
    meta: { title: 'Manage metrics', sub: 'Create, edit and delete metrics. Every change is validated by the API.' }
  },
  {
    // Dynamic route: only positive integer IDs match; anything else falls
    // through to the not-found route. The ID arrives as a prop.
    path: '/metrics/:id(\\d+)',
    name: 'metric',
    component: () => import('../views/MetricDetailView.vue'),
    props: (route) => ({ id: Number(route.params.id) }),
    meta: { title: 'Metric details', sub: 'One metric, its live value and every change seen this session.' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Not found', sub: '' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Realtime Metrics Dashboard` : 'Realtime Metrics Dashboard';
});

export default router;

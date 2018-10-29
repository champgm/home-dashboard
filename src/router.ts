import Vue from 'vue';
import Router from 'vue-router';
import FavoritesView from './views/FavoritesView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Favorites',
      component: FavoritesView,
    },
    {
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      path: '/lights',
      name: 'Lights',
      component: () => import(/* webpackChunkName: "lights" */ './views/LightsView.vue'),
    },
    {
      path: '/plugs',
      name: 'Plugs',
      component: () => import(/* webpackChunkName: "plugs" */ './views/PlugsView.vue'),
    },
  ],
});

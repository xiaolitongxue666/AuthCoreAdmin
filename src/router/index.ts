import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LOGIN_MODE === 'wx'
        ? () => import('@/views/WxQrLoginView.vue')
        : () => import('@/views/PasswordLoginView.vue'),
    },
    {
      path: '/wx-login',
      name: 'wx-login',
      component: () => import('@/views/WxLoginView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Users.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/Users.vue'),
    },
    {
      path: '/apps',
      name: 'apps',
      component: () => import('@/views/Apps.vue'),
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('@/views/Roles.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/Tags.vue'),
    },
    {
      path: '/labels',
      name: 'labels',
      component: () => import('@/views/Labels.vue'),
    },
    {
      path: '/actions',
      name: 'actions',
      component: () => import('@/views/Actions.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = window.localStorage.getItem('Authorization')
  if (to.name !== 'login' && to.name !== 'wx-login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import reputationRoutes from '@/reputation/presentation/reputation-routes.js'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/',         redirect: '/home' },
        { path: '/home',     name: 'home',      component: () => import('@/shared/presentation/views/home-view.vue'),         meta: { title: 'Home' } },
        { path: '/about',    name: 'about',     component: () => import('@/shared/presentation/views/about-view.vue'),        meta: { title: 'About' } },
        { path: '/reputation', name: 'reputation', children: reputationRoutes },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/shared/presentation/views/not-found-view.vue'), meta: { title: 'Not Found' } }
    ]
})

router.beforeEach((to) => {
    document.title = `SkillSwap | ${to.meta.title || ''}`
})

export default router
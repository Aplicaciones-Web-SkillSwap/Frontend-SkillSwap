import {createRouter, createWebHistory} from 'vue-router';
import Home from "@/shared/presentation/views/home.vue";
import useAuthStore from "@/iam/application/auth.store.js";

import workspaceRoutes   from "@/workspace/presentation/workspace-routes.js";
import paymentRoutes     from "@/payment/presentation/payment-routes.js";
import moderationRoutes  from "@/moderation/presentation/moderation-routes.js";
import discoveryRoutes   from "@/discovery/presentation/discovery-routes.js";
import reputationRoutes  from "@/reputation/presentation/reputation-routes.js";
import learningRoutes    from "@/learning/presentation/learning-routes.js";

const about        = () => import("@/shared/presentation/views/about.vue");
const pageNotFound = () => import("@/shared/presentation/views/page-not-found.vue");
const coordinatorDashboard = () => import("@/shared/presentation/views/coordinator-dashboard.vue");
const login        = () => import("@/iam/presentation/views/login.vue");
const register      = () => import("@/iam/presentation/views/register.vue");

const routes = [
    { path: '/login',           name: 'login',      component: login,       meta: { title: 'Login', public: true } },
    { path: '/register',        name: 'register',   component: register,    meta: { title: 'Register', public: true } },

    { path: '/home',            name: 'home',       component: Home,        meta: { title: 'Home'          } },
    { path: '/dashboard',       name: 'coordinator-dashboard', component: coordinatorDashboard, meta: { title: 'Coordinator Dashboard', requiresRole: 'Coordinator' } },

    { path: '/workspace',       name: 'workspace',  children: workspaceRoutes                                 },
    { path: '/payment',         name: 'payment',    children: paymentRoutes                                   },
    { path: '/moderation',      name: 'moderation', children: moderationRoutes                                },
    { path: '/discovery',       name: 'discovery',  children: discoveryRoutes                                 },
    { path: '/reputation',      name: 'reputation', children: reputationRoutes                                },
    { path: '/learning',        name: 'learning',   children: learningRoutes                                  },

    { path: '/',                redirect: '/home'                                                             },
    { path: '/:pathMatch(.*)*', name: 'not-found',  component: pageNotFound, meta: { title: 'Page Not Found', public: true } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

router.beforeEach((to, from) => {
    console.log(`Navigating from ${from.name} to ${to.name}`);
    let baseTitle = 'SkillSwap';
    document.title = `${baseTitle} - ${to.meta['title']}`;

    const authStore = useAuthStore();

    if (!authStore.isAuthenticated && !to.meta.public) {
        return { name: 'login' };
    }

    if (authStore.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
        return { name: 'home' };
    }

    if (to.meta.requiresRole && authStore.user?.role !== to.meta.requiresRole) {
        return { name: 'home' };
    }
});

export default router;
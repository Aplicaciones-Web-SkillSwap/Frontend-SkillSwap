import {createRouter, createWebHistory} from 'vue-router';
import Home from "@/shared/presentation/views/home.vue";
import workspaceRoutes   from "@/workspace/presentation/workspace-routes.js";
import paymentRoutes     from "@/payment/presentation/payment-routes.js";
import moderationRoutes  from "@/moderation/presentation/moderation-routes.js";

const about        = () => import("@/shared/presentation/views/about.vue");
const pageNotFound = () => import("@/shared/presentation/views/page-not-found.vue");

const routes = [
    { path: '/home',            name: 'home',       component: Home,        meta: { title: 'Home'          } },
    { path: '/about',           name: 'about',      component: about,       meta: { title: 'About'         } },
    { path: '/workspace',       name: 'workspace',   children: workspaceRoutes                                 },
    { path: '/payment',         name: 'payment',     children: paymentRoutes                                   },
    { path: '/moderation',      name: 'moderation',  children: moderationRoutes                                },
    { path: '/',                redirect: '/home'                                                            },
    { path: '/:pathMatch(.*)*', name: 'not-found',  component: pageNotFound, meta: { title: 'Page Not Found'} }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

router.beforeEach((to, from) => {
    console.log(`Navigating from ${from.name} to ${to.name}`);
    let baseTitle = 'SkillSwap';
    document.title = `${baseTitle} - ${to.meta['title']}`;
});

export default router;

// Rutas del BC Moderation — se montan bajo /moderation en el router principal
// Las vistas se renderizan dentro del layout existente del proyecto develop
const reportList   = () => import('./views/report-list.vue');
const reportForm   = () => import('./views/report-form.vue');
const reportChat   = () => import('./views/report-chat.vue');
const sanctionList = () => import('./views/sanction-list.vue');
const sanctionForm = () => import('./views/sanction-form.vue');

const moderationRoutes = [
    { path: 'reports',              name: 'moderation-reports',        component: reportList,   meta: { title: 'Reports'       } },
    { path: 'reports/new',          name: 'moderation-reports-new',    component: reportForm,   meta: { title: 'New Report'    } },
    { path: 'reports/chat/:userId', name: 'moderation-reports-chat',   component: reportChat,   meta: { title: 'Report Chat'   } },
    { path: 'reports/:id/edit',     name: 'moderation-reports-edit',   component: reportForm,   meta: { title: 'Edit Report'   } },
    { path: 'sanctions',            name: 'moderation-sanctions',      component: sanctionList, meta: { title: 'Sanctions'     } },
    { path: 'sanctions/new',        name: 'moderation-sanctions-new',  component: sanctionForm, meta: { title: 'New Sanction'  } },
    { path: 'sanctions/:id/edit',   name: 'moderation-sanctions-edit', component: sanctionForm, meta: { title: 'Edit Sanction' } },
    { path: '',                     redirect: 'reports'                                                                          }
];

export default moderationRoutes;

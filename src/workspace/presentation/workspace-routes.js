const sessionList   = () => import('./views/session-list.vue');
const sessionForm   = () => import('./views/session-form.vue');
const workspaceView = () => import('./views/workspace-view.vue');

const workspaceRoutes = [
    { path: 'sessions',           name: 'workspace-sessions',      component: sessionList,   meta: { title: 'Sessions'     } },
    { path: 'sessions/new',       name: 'workspace-sessions-new',  component: sessionForm,   meta: { title: 'New Session'  } },
    { path: 'sessions/:id/edit',  name: 'workspace-sessions-edit', component: sessionForm,   meta: { title: 'Edit Session' } },
    { path: 'sessions/:id',       name: 'workspace-sessions-view', component: workspaceView, meta: { title: 'Workspace'    } },
];

export default workspaceRoutes;

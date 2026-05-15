const reputationRoutes = [
    {
        path:      'reviews',
        name:      'reputation-reviews',
        component: () => import('./views/review-list.vue'),
        meta:      { title: 'Reviews' }
    },
    {
        path:      'reviews/new',
        name:      'reputation-reviews-new',
        component: () => import('./views/review-form.vue'),
        meta:      { title: 'New Review' }
    },
    {
        path:      'reviews/:id/edit',
        name:      'reputation-reviews-edit',
        component: () => import('./views/review-form.vue'),
        meta:      { title: 'Edit Review' }
    },
    {
        path:      'reputations',
        name:      'reputation-reputations',
        component: () => import('./views/reputation-list.vue'),
        meta:      { title: 'Reputations' }
    },
]

export default reputationRoutes
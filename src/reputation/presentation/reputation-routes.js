const reviewList      = () => import('./views/review-list.vue');
const reviewForm      = () => import('./views/review-form.vue');
const reputationList  = () => import('./views/reputation-list.vue');

const reputationRoutes = [
    { path: 'reviews',           name: 'reputation-reviews',      component: reviewList,     meta: { title: 'Reviews'     } },
    { path: 'reviews/new',       name: 'reputation-reviews-new',  component: reviewForm,     meta: { title: 'New Review'  } },
    { path: 'reviews/:id/edit',  name: 'reputation-reviews-edit', component: reviewForm,     meta: { title: 'Edit Review' } },
    { path: 'reputations',       name: 'reputation-reputations',  component: reputationList, meta: { title: 'Reputations' } },
];

export default reputationRoutes;

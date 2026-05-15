const tutorSearch  = () => import('./views/tutor-search.vue');
const tutorProfile = () => import('./views/tutor-profile.vue');

const discoveryRoutes = [
    { path: 'search',        name: 'discovery-search',  component: tutorSearch,  meta: { title: 'Find Tutors'   } },
    { path: 'tutors/:id',    name: 'discovery-profile', component: tutorProfile, meta: { title: 'Tutor Profile'  } },
];

export default discoveryRoutes;

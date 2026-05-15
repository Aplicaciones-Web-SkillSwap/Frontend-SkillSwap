const quizList = () => import('./views/quiz-list.vue');
const quizForm = () => import('./views/quiz-form.vue');

const learningRoutes = [
    { path: 'quizzes',          name: 'learning-quizzes',      component: quizList, meta: { title: 'Quiz Bank' } },
    { path: 'quizzes/new',      name: 'learning-quizzes-new',  component: quizForm, meta: { title: 'New Quiz'  } },
    { path: 'quizzes/:id/edit', name: 'learning-quizzes-edit', component: quizForm, meta: { title: 'Edit Quiz' } },
    { path: '',                 redirect: 'quizzes'                                                               }
];

export default learningRoutes;
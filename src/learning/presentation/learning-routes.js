const quizList    = () => import('./views/quiz-list.vue');
const quizForm     = () => import('./views/quiz-form.vue');
const quizAttempt  = () => import('./views/quiz-attempt.vue');
const quizResults  = () => import('./views/quiz-results.vue');

const learningRoutes = [
    { path: 'quizzes',             name: 'learning-quizzes',         component: quizList,    meta: { title: 'Quiz Bank'   } },
    { path: 'quizzes/new',         name: 'learning-quizzes-new',     component: quizForm,    meta: { title: 'New Quiz'    } },
    { path: 'quizzes/:id/edit',    name: 'learning-quizzes-edit',    component: quizForm,    meta: { title: 'Edit Quiz'   } },
    { path: 'quizzes/:id/attempt', name: 'learning-quizzes-attempt', component: quizAttempt, meta: { title: 'Take Quiz'   } },
    { path: 'quizzes/:id/results', name: 'learning-quizzes-results', component: quizResults, meta: { title: 'Quiz Results'} },
    { path: '',                    redirect: 'quizzes'                                                                       }
];

export default learningRoutes;
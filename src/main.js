import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Material from '@primeuix/themes/material';
import PrimeVue from 'primevue/config';
import i18n from "@/i18n.js";
import {
    Avatar,
    Button,
    Card,
    Checkbox,
    Column,
    ConfirmationService,
    ConfirmDialog, DataTable, DatePicker, Dialog,
    DialogService, Drawer, FileUpload, FloatLabel, IconField, InputIcon, InputNumber, InputText, Menu,
    Password, Rating, Row, Select, SelectButton, Tag, Textarea, Toast,
    ToastService, Toolbar, Tooltip
} from "primevue";
import pinia from "@/pinia.js";
import router from "@/router.js";



const app = createApp(App)
    .use(i18n)
    .use(PrimeVue, { theme: { preset: Material, options: { darkModeSelector: false } }, ripple: true })
    .use(ConfirmationService)
    .use(DialogService)
    .use(ToastService)
    .component('pv-avatar',         Avatar)
    .component('pv-button',         Button)
    .component('pv-card',           Card)
    .component('pv-column',         Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-checkbox',       Checkbox)
    .component('pv-data-table',     DataTable)
    .component('pv-date-picker',    DatePicker)
    .component('pv-dialog',         Dialog)
    .component('pv-select',         Select)
    .component('pv-select-button',  SelectButton)
    .component('pv-file-upload',    FileUpload)
    .component('pv-float-label',    FloatLabel)
    .component('pv-icon-field',     IconField)
    .component('pv-input-icon',     InputIcon)
    .component('pv-input-text',     InputText)
    .component('pv-input-number',   InputNumber)
    .component('pv-menu',           Menu)
    .component('pv-password',       Password)
    .component('pv-rating',         Rating)
    .component('pv-row',            Row)
    .component('pv-drawer',         Drawer)
    .component('pv-tag',            Tag)
    .component('pv-textarea',       Textarea)
    .component('pv-toolbar',        Toolbar)
    .component('pv-toast',          Toast)
    .component('tooltip',           Tooltip)
    .use(pinia)
    .use(router);

// Pinia must be installed before the router: installing the router triggers its
// initial navigation right away (running the `beforeEach` guard, which reads
// `useAuthStore()`), so on a fresh load Pinia needs to already be active or that
// first guard silently sees no store and the role-based redirect never happens.
//
// Wait for the router to resolve the initial route before mounting, otherwise
// `route.meta` can briefly be empty on first render and let `layout.vue` mount
// (and fire an authenticated fetch) before the auth guard has had a chance to run.
router.isReady().then(() => app.mount('#app'));

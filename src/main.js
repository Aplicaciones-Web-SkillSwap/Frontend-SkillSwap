import './assets/main.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import PrimeVue         from 'primevue/config'
import Aura             from '@primevue/themes/aura'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService     from 'primevue/toastservice'

import App    from './App.vue'
import router from './router.js'
import i18n   from './i18n.js'

// PrimeVue components
import Button         from 'primevue/button'
import DataTable      from 'primevue/datatable'
import Column         from 'primevue/column'
import InputText      from 'primevue/inputtext'
import InputNumber    from 'primevue/inputnumber'
import Textarea       from 'primevue/textarea'
import Select         from 'primevue/select'
import Rating         from 'primevue/rating'
import Tag            from 'primevue/tag'
import FloatLabel     from 'primevue/floatlabel'
import ConfirmDialog  from 'primevue/confirmdialog'
import Toast          from 'primevue/toast'
import Toolbar        from 'primevue/toolbar'
import Menu           from 'primevue/menu'
import Menubar        from 'primevue/menubar'
import SelectButton   from 'primevue/selectbutton'
import Card           from 'primevue/card'
import Dialog         from 'primevue/dialog'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(ConfirmationService)
app.use(ToastService)

app.component('pv-button',        Button)
app.component('pv-data-table',    DataTable)
app.component('pv-column',        Column)
app.component('pv-input-text',    InputText)
app.component('pv-input-number',  InputNumber)
app.component('pv-textarea',      Textarea)
app.component('pv-select',        Select)
app.component('pv-rating',        Rating)
app.component('pv-tag',           Tag)
app.component('pv-float-label',   FloatLabel)
app.component('pv-confirm-dialog',ConfirmDialog)
app.component('pv-toast',         Toast)
app.component('pv-toolbar',       Toolbar)
app.component('pv-menu',          Menu)
app.component('pv-menubar',       Menubar)
app.component('pv-select-button', SelectButton)
app.component('pv-card',          Card)
app.component('pv-dialog',        Dialog)

app.mount('#app')
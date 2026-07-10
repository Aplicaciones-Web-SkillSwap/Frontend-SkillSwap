import en from "./locales/en.json"
import es from "./locales/es.json"
import {createI18n} from "vue-i18n";

const LOCALE_KEY = 'skillswap_locale';

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem(LOCALE_KEY) || "es",
    fallbackLocale: "es",
    messages: { en, es }
});

export default i18n;

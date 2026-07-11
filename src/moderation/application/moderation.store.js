import { defineStore }       from 'pinia';
import { ref, computed }     from 'vue';
import { ModerationApi }     from '@/moderation/infrastructure/moderation-api.js';
import { ReportAssembler }   from '@/moderation/infrastructure/report-assembler.js';
import { SanctionAssembler } from '@/moderation/infrastructure/sanction-assembler.js';

const moderationApi = new ModerationApi();

const useModerationStore = defineStore('moderation', () => {

    const reports   = ref([]);
    const sanctions = ref([]);
    const loading   = ref(false);
    const error     = ref(null);

    const reportCount     = computed(() => reports.value.length);
    const sanctionCount   = computed(() => sanctions.value.length);
    const activeReports   = computed(() => reports.value.filter(r => !r.closed));
    const resolvedReports = computed(() => reports.value.filter(r => r.closed));

    /** Sanciones del usuario autenticado, para el popup de advertencia/ban */
    const mySanctions       = ref([]);
    const mySanctionsLoaded = ref(false);

    /** La sanción propia más antigua que aún no fue reconocida, si hay alguna */
    const nextUnacknowledgedSanction = computed(() => {
        const pending = mySanctions.value
            .filter(s => !s.acknowledgedAt)
            .sort((a, b) => a.createdAt - b.createdAt);
        return pending[0] ?? null;
    });

    // ── Reports ───────────────────────────────────────────────────

    /**
     * @param {{silent?: boolean}} options - `silent: true` refreshes data without
     *     toggling `loading` (used by background polling, to avoid flashing the spinner).
     */
    function fetchReports({ silent = false } = {}) {
        if (!silent) loading.value = true;
        return moderationApi.getReports()
            .then(response => {
                reports.value = ReportAssembler.toEntitiesFromResponse(response);
                if (!silent) loading.value = false;
            })
            .catch(err => {
                error.value = err.message || 'Failed to load reports';
                if (!silent) loading.value = false;
                console.error('Error fetching reports:', err);
            });
    }

    /**
     * @returns {Promise<{ok: boolean, data?: object, errorType?: 'duplicate-pending'|'invalid'|'unknown'}>}
     */
    async function addReport(report) {
        const resource = ReportAssembler.toResourceFromEntity(report);
        try {
            const response = await moderationApi.createReport(resource);
            const newReport = ReportAssembler.toEntityFromResource(response.data);
            reports.value.push(newReport);
            return { ok: true, data: newReport };
        } catch (err) {
            const status = err.response?.status;
            error.value = err.message;
            if (status === 409) return { ok: false, errorType: 'duplicate-pending' };
            if (status === 400) return { ok: false, errorType: 'invalid' };
            return { ok: false, errorType: 'unknown' };
        }
    }

    /** PATCH /Reports/{id}/close — la única transición de estado soportada */
    function closeReport(reportId) {
        return moderationApi.closeReport(reportId)
            .then(response => {
                const updated = ReportAssembler.toEntityFromResource(response.data);
                const index   = reports.value.findIndex(r => r.id === updated.id);
                if (index !== -1) reports.value[index] = updated;
                return updated;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    function getReportById(id) {
        return reports.value.find(r => r.id === parseInt(id));
    }

    // ── Sanctions ─────────────────────────────────────────────────

    /**
     * @param {{silent?: boolean}} options - `silent: true` refreshes data without
     *     toggling `loading` (used by background polling, to avoid flashing the spinner).
     */
    function fetchSanctions({ silent = false } = {}) {
        if (!silent) loading.value = true;
        return moderationApi.getSanctions()
            .then(response => {
                sanctions.value = SanctionAssembler.toEntitiesFromResponse(response);
                if (!silent) loading.value = false;
            })
            .catch(err => {
                error.value = err.message || 'Failed to load sanctions';
                if (!silent) loading.value = false;
                console.error('Error fetching sanctions:', err);
            });
    }

    function addSanction(sanction) {
        const resource = SanctionAssembler.toResourceFromEntity(sanction);
        return moderationApi.createSanction(resource)
            .then(response => {
                const newSanction = SanctionAssembler.toEntityFromResource(response.data);
                sanctions.value.push(newSanction);
                return newSanction;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    function getSanctionById(id) {
        return sanctions.value.find(s => s.id === parseInt(id));
    }

    /** GET /Sanctions/me — se llama al montar el layout y en cada navegación */
    function fetchMySanctions() {
        return moderationApi.getMySanctions()
            .then(response => {
                mySanctions.value = SanctionAssembler.toEntitiesFromResponse(response);
                mySanctionsLoaded.value = true;
            })
            .catch(err => { error.value = err.message; });
    }

    /** PATCH /Sanctions/{id}/acknowledge */
    function acknowledgeSanction(id) {
        return moderationApi.acknowledgeSanction(id)
            .then(response => {
                const updated = SanctionAssembler.toEntityFromResource(response.data);
                const index   = mySanctions.value.findIndex(s => s.id === updated.id);
                if (index !== -1) mySanctions.value[index] = updated;
                return updated;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    return {
        reports, sanctions, loading, error,
        reportCount, sanctionCount, activeReports, resolvedReports,
        fetchReports, addReport, closeReport, getReportById,
        fetchSanctions, addSanction, getSanctionById,
        mySanctions, mySanctionsLoaded, nextUnacknowledgedSanction,
        fetchMySanctions, acknowledgeSanction
    };
});

export default useModerationStore;
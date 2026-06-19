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

    // ── Reports ───────────────────────────────────────────────────

    function fetchReports() {
        loading.value = true;
        moderationApi.getReports()
            .then(response => {
                reports.value = ReportAssembler.toEntitiesFromResponse(response);
                loading.value = false;
            })
            .catch(err => {
                error.value   = err.message || 'Failed to load reports';
                loading.value = false;
                console.error('Error fetching reports:', err);
            });
    }

    function addReport(report) {
        const resource = ReportAssembler.toResourceFromEntity(report);
        return moderationApi.createReport(resource)
            .then(response => {
                const newReport = ReportAssembler.toEntityFromResource(response.data);
                reports.value.push(newReport);
                return newReport;
            })
            .catch(err => { error.value = err.message; return null; });
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

    function fetchSanctions() {
        loading.value = true;
        moderationApi.getSanctions()
            .then(response => {
                sanctions.value = SanctionAssembler.toEntitiesFromResponse(response);
                loading.value   = false;
            })
            .catch(err => {
                error.value   = err.message || 'Failed to load sanctions';
                loading.value = false;
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

    return {
        reports, sanctions, loading, error,
        reportCount, sanctionCount, activeReports, resolvedReports,
        fetchReports, addReport, closeReport, getReportById,
        fetchSanctions, addSanction, getSanctionById
    };
});

export default useModerationStore;
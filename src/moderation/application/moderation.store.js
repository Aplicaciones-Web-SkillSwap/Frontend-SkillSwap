import { defineStore }       from 'pinia';
import { ref, computed }     from 'vue';
import { ModerationApi }     from '@/moderation/infrastructure/moderation-api.js';
import { ReportAssembler }   from '@/moderation/infrastructure/report-assembler.js';
import { SanctionAssembler } from '@/moderation/infrastructure/sanction-assembler.js';
import { Report }            from '@/moderation/domain/model/report-entity.js';
import { Sanction }          from '@/moderation/domain/model/sanction-entity.js';

const moderationApi = new ModerationApi();

const useModerationStore = defineStore('moderation', () => {

    // ── State ─────────────────────────────────────────────────────
    const reports   = ref([]);
    const sanctions = ref([]);
    const loading   = ref(false);
    const error     = ref(null);

    // ── Computed ──────────────────────────────────────────────────
    const reportCount    = computed(() => reports.value.length);
    const sanctionCount  = computed(() => sanctions.value.length);
    const pendingReports = computed(() => reports.value.filter(r => r.isPending()));
    const activeReports  = computed(() => reports.value.filter(r => !r.closed));
    const resolvedReports= computed(() => reports.value.filter(r => r.closed));

    // ── Reports CRUD ──────────────────────────────────────────────
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
        moderationApi.createReport(resource)
            .then(response => {
                const newReport = ReportAssembler.toEntityFromResource(response.data);
                reports.value.push(newReport);
            })
            .catch(err => { error.value = err.message; });
    }

    function updateReport(report) {
        const resource = ReportAssembler.toResourceFromEntity(report);
        moderationApi.updateReport(report.id, resource)
            .then(response => {
                const updated = ReportAssembler.toEntityFromResource(response.data);
                const index   = reports.value.findIndex(r => r.id === updated.id);
                if (index !== -1) reports.value[index] = updated;
            })
            .catch(err => { error.value = err.message; });
    }

    function deleteReport(id) {
        moderationApi.deleteReport(id)
            .then(() => {
                const index = reports.value.findIndex(r => r.id === id);
                if (index !== -1) reports.value.splice(index, 1);
            })
            .catch(err => { error.value = err.message; });
    }

    function getReportById(id) {
        return reports.value.find(r => r.id === parseInt(id));
    }

    // ── Sanctions CRUD ────────────────────────────────────────────
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
        moderationApi.createSanction(resource)
            .then(response => {
                const newSanction = SanctionAssembler.toEntityFromResource(response.data);
                sanctions.value.push(newSanction);
            })
            .catch(err => { error.value = err.message; });
    }

    function updateSanction(sanction) {
        const resource = SanctionAssembler.toResourceFromEntity(sanction);
        moderationApi.updateSanction(sanction.id, resource)
            .then(response => {
                const updated = SanctionAssembler.toEntityFromResource(response.data);
                const index   = sanctions.value.findIndex(s => s.id === updated.id);
                if (index !== -1) sanctions.value[index] = updated;
            })
            .catch(err => { error.value = err.message; });
    }

    function deleteSanction(id) {
        moderationApi.deleteSanction(id)
            .then(() => {
                const index = sanctions.value.findIndex(s => s.id === id);
                if (index !== -1) sanctions.value.splice(index, 1);
            })
            .catch(err => { error.value = err.message; });
    }

    function getSanctionById(id) {
        return sanctions.value.find(s => s.id === parseInt(id));
    }

    return {
        reports, sanctions, loading, error,
        reportCount, sanctionCount, pendingReports, activeReports, resolvedReports,
        fetchReports, addReport, updateReport, deleteReport, getReportById,
        fetchSanctions, addSanction, updateSanction, deleteSanction, getSanctionById
    };
});

export default useModerationStore;

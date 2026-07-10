export class Report {
    constructor({
                    id             = null,
                    reportedUserId = 0,
                    reporterUserId = 0,
                    sessionId      = null,
                    reason         = '',
                    status         = 'pending',
                    closed         = false,
                    reportedAt     = new Date().toISOString(),
                    resolvedAt     = null
                }) {
        this.id             = id;
        this.reportedUserId = reportedUserId;
        this.reporterUserId = reporterUserId;
        this.sessionId      = sessionId;
        this.reason         = reason;
        this.status         = status;
        this.closed         = closed ?? false;
        this.reportedAt     = new Date(reportedAt);
        this.resolvedAt     = resolvedAt ? new Date(resolvedAt) : null;
    }

    getFormattedReportedAt() {
        return this.reportedAt.toLocaleDateString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    }
}
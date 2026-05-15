export class Report {
  constructor({
    id             = null,
    reportedUserId = 0,
    reporterUserId = 0,
    reason         = '',
    status         = 'pending',
    closed         = false,
    createdAt      = new Date().toISOString()
  }) {
    this.id             = id;
    this.reportedUserId = reportedUserId;
    this.reporterUserId = reporterUserId;
    this.reason         = reason;
    this.status         = status;
    this.closed         = closed ?? false;
    this.createdAt      = new Date(createdAt);
  }

  getFormattedCreatedAt() {
    return this.createdAt.toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  }

  isPending() {
    return this.status === 'pending';
  }
}

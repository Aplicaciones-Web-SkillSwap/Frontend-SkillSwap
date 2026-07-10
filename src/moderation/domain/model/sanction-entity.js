export class Sanction {
  constructor({
    id               = null,
    reportId         = 0,
    sanctionedUserId = 0,
    type             = 'warning',
    description      = '',
    durationDays     = 0,
    isPermanent      = false,
    createdAt        = new Date().toISOString(),
    acknowledgedAt   = null
  }) {
    this.id               = id;
    this.reportId         = reportId;
    this.sanctionedUserId = sanctionedUserId;
    this.type             = type;
    this.description      = description;
    this.durationDays     = durationDays;
    this.isPermanent      = isPermanent;
    this.createdAt        = new Date(createdAt);
    this.acknowledgedAt   = acknowledgedAt ? new Date(acknowledgedAt) : null;
  }

  isBan() {
    return this.type === 'ban';
  }

  bannedUntil() {
    if (!this.isBan() || this.isPermanent) return null;
    return new Date(this.createdAt.getTime() + this.durationDays * 24 * 60 * 60 * 1000);
  }
}

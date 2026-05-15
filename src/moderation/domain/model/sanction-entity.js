export class Sanction {
  constructor({
    id               = null,
    reportId         = 0,
    sanctionedUserId = 0,
    type             = 'warning',
    description      = '',
    durationDays     = 0,
    createdAt        = new Date().toISOString()
  }) {
    this.id               = id;
    this.reportId         = reportId;
    this.sanctionedUserId = sanctionedUserId;
    this.type             = type;
    this.description      = description;
    this.durationDays     = durationDays;
    this.createdAt        = new Date(createdAt);
  }

  isBan() {
    return this.type === 'ban';
  }
}

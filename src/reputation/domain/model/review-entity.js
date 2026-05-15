export class Review {
    constructor({
        id        = null,
        tutorId   = null,
        studentId = null,
        sessionId = null,
        score     = 0,
        comment   = '',
        status    = 'PENDING',
        date      = null,
    }) {
        this.id        = id;
        this.tutorId   = tutorId;
        this.studentId = studentId;
        this.sessionId = sessionId;
        this.score     = score;
        this.comment   = comment;
        this.status    = status;
        this.date      = date;
    }

    isPublished() { return this.status === 'PUBLISHED'; }
    isRemoved()   { return this.status === 'REMOVED';   }
    isPending()   { return this.status === 'PENDING';   }
}

export class Review {
    constructor({
                    id         = null,
                    tutorId    = null,
                    learnerId  = null,
                    reviewerId = null,
                    sessionId  = null,
                    rating     = 0,
                    comment    = '',
                    reviewedAt = null,
                }) {
        this.id         = id;
        this.tutorId    = tutorId;
        this.learnerId  = learnerId;
        this.reviewerId = reviewerId;
        this.sessionId  = sessionId;
        this.rating     = rating;
        this.comment    = comment;
        this.reviewedAt = reviewedAt;
    }
}
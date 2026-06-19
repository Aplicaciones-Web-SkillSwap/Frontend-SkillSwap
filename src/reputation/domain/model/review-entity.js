export class Review {
    constructor({
                    id         = null,
                    tutorId    = null,
                    reviewerId = null,
                    sessionId  = null,
                    rating     = 0,
                    comment    = '',
                    reviewedAt = null,
                }) {
        this.id         = id;
        this.tutorId    = tutorId;
        this.reviewerId = reviewerId;
        this.sessionId  = sessionId;
        this.rating     = rating;
        this.comment    = comment;
        this.reviewedAt = reviewedAt;
    }
}
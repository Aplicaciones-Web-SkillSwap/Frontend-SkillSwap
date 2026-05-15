export class Reputation {
    constructor({
                    id               = null,
                    tutorId          = null,
                    averageScore     = 0,
                    totalReviews     = 0,
                    publishedReviews = 0,
                }) {
        this.id               = id
        this.tutorId          = tutorId
        this.averageScore     = averageScore
        this.totalReviews     = totalReviews
        this.publishedReviews = publishedReviews
    }
}
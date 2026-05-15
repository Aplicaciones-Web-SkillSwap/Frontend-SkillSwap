export class Session {
    constructor({ id = null, learnerId = null, tutorId = null, topic = '', status = 'pending', scheduledAt = null, courseId = null }) {
        this.id          = id;
        this.learnerId   = learnerId;
        this.tutorId     = tutorId;
        this.topic       = topic;
        this.status      = status;
        this.scheduledAt = scheduledAt;
        this.courseId    = courseId;
    }
}

export class Quiz {
    constructor({
                    id          = null,
                    tutorId     = 0,
                    course      = '',
                    title       = '',
                    description = '',
                    questions   = [],
                    status      = 'draft',
                    createdAt   = new Date().toISOString()
                }) {
        this.id          = id;
        this.tutorId     = tutorId;
        this.course      = course;
        this.title       = title;
        this.description = description;
        this.questions   = questions;
        this.status      = status;
        this.createdAt   = new Date(createdAt);
    }

    getFormattedCreatedAt() {
        return this.createdAt.toLocaleDateString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    }

    isPublished() { return this.status === 'published'; }
    questionCount() { return this.questions.length; }
}
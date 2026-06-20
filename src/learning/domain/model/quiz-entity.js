export class Question {
    constructor({
                    id             = null,
                    questionString = '',
                    answers        = ['', '', '', ''],
                    correctAnswer  = 0
                }) {
        this.id             = id;
        this.questionString = questionString;
        this.answers        = answers;
        this.correctAnswer  = correctAnswer;
    }
}

export class Quiz {
    constructor({
                    id          = null,
                    tutorId     = 0,
                    course      = '',
                    title       = '',
                    description = '',
                    questions   = []
                }) {
        this.id          = id;
        this.tutorId     = tutorId;
        this.course      = course;
        this.title       = title;
        this.description = description;
        this.questions   = questions.map(q => q instanceof Question ? q : new Question(q));
    }

    questionCount() { return this.questions.length; }
}
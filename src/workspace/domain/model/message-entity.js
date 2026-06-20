export class Message {
    constructor({
                    id        = null,
                    sessionId = null,
                    senderId  = null,
                    content   = '',
                    fileUrl   = null,
                    fileName  = null,
                    sentAt    = null,
                    quizId    = null,
                    quizTitle = null
                }) {
        this.id        = id;
        this.sessionId = sessionId;
        this.senderId  = senderId;
        this.content   = content;
        this.fileUrl   = fileUrl;
        this.fileName  = fileName;
        this.sentAt    = sentAt;
        this.quizId    = quizId;
        this.quizTitle = quizTitle;
    }

    isQuiz() { return this.quizId != null; }
}
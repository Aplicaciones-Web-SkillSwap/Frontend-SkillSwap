export class User {
    constructor({
                    id         = null,
                    username   = '',
                    email      = '',
                    role       = 'Student',
                    isVerified = false,
                }) {
        this.id         = id;
        this.username   = username;
        this.email      = email;
        this.role       = role;
        this.isVerified = isVerified;
    }
}

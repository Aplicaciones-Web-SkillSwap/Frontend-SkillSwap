export class Tutor {
    constructor({
                    id              = null,
                    userId          = null,
                    name            = '',
                    university      = '',
                    career          = '',
                    bio             = '',
                    skills          = [],
                    rating          = 0,
                    reviewCount     = 0,
                    verified        = false,
                    online          = false,
                    avatarUrl       = null,
                    experienceYears = 0,
                    mainSubject     = '',
                }) {
        this.id              = id;
        this.userId          = userId;
        this.name            = name;
        this.university      = university;
        this.career          = career;
        this.bio             = bio;
        this.skills          = skills;
        this.rating          = rating;
        this.reviewCount     = reviewCount;
        this.verified        = verified;
        this.online          = online;
        this.avatarUrl       = avatarUrl;
        this.experienceYears = experienceYears;
        this.mainSubject     = mainSubject;
    }
}
import {ReputationApi}       from "@/reputation/infrastructure/reputation-api.js";
import {defineStore}          from "pinia";
import {computed, ref}        from "vue";
import {ReviewAssembler}      from "@/reputation/infrastructure/review.assembler.js";
import {ReputationAssembler}  from "@/reputation/infrastructure/reputation.assembler.js";
import {Review}               from "@/reputation/domain/model/review-entity.js";

const reputationApi = new ReputationApi();

const useReputationStore = defineStore('reputation', () => {

    const reviews           = ref([]);
    const reputations       = ref([]);
    const errors            = ref([]);
    const reviewsLoaded     = ref(false);
    const reputationsLoaded = ref(false);

    const publishedReviews = computed(() => reviews.value.filter(r => r.isPublished()));

    const averageScore = computed(() => {
        const pub = publishedReviews.value;
        if (!pub.length) return 0;
        return +(pub.reduce((s, r) => s + r.score, 0) / pub.length).toFixed(1);
    });

    // ── Reviews ──────────────────────────────────────────────────────────────

    function fetchReviews() {
        reputationApi.getReviews().then(response => {
            reviews.value = ReviewAssembler.toEntitiesFromResponse(response);
            reviewsLoaded.value = true;
            console.log(reviewsLoaded.value);
            console.log(reviews.value);
        }).catch(error => {
            errors.value.push(error);
            console.log('Error fetching reviews:', error);
        });
    }

    function getReviewById(id) {
        return reviews.value.find(r => r.id === parseInt(id));
    }

    function getReviewsByTutorId(tutorId) {
        let idNum = parseInt(tutorId);
        return reviews.value.filter(r => r.tutorId === idNum);
    }

    function addReview(review) {
        const body = ReviewAssembler.toResourceFromEntity(review);
        reputationApi.createReview(body).then(response => {
            const newReview = ReviewAssembler.toEntityFromResource(response.data);
            reviews.value.push(newReview);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function updateReview(review) {
        const body = ReviewAssembler.toResourceFromEntity(review);
        reputationApi.updateReview(review.id, body).then(response => {
            const updated = ReviewAssembler.toEntityFromResource(response.data);
            const index = reviews.value.findIndex(r => r.id === updated.id);
            if (index !== -1) reviews.value[index] = updated;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteReview(review) {
        reputationApi.deleteReview(review.id).then(() => {
            const index = reviews.value.findIndex(r => r.id === review.id);
            if (index !== -1) reviews.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function publishReview(review) {
        updateReview(new Review({ ...review, status: 'PUBLISHED' }));
    }

    function removeReview(review) {
        updateReview(new Review({ ...review, status: 'REMOVED' }));
    }

    // ── Reputations ───────────────────────────────────────────────────────────

    function fetchReputations() {
        reputationApi.getReputations().then(response => {
            reputations.value = ReputationAssembler.toEntitiesFromResponse(response);
            reputationsLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function getReputationByTutorId(tutorId) {
        let idNum = parseInt(tutorId);
        return reputations.value.find(r => r.tutorId === idNum);
    }

    return {
        reviews, reputations,
        errors,
        reviewsLoaded, reputationsLoaded,
        publishedReviews, averageScore,
        fetchReviews, getReviewById, getReviewsByTutorId,
        addReview, updateReview, deleteReview,
        publishReview, removeReview,
        fetchReputations, getReputationByTutorId,
    };
});

export default useReputationStore;

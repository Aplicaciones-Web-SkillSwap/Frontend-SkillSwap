import {ReputationApi}   from "@/reputation/infrastructure/reputation-api.js";
import {defineStore}     from "pinia";
import {computed, ref}   from "vue";
import {ReviewAssembler} from "@/reputation/infrastructure/review.assembler.js";

const reputationApi = new ReputationApi();

const useReputationStore = defineStore('reputation', () => {

    const reviews       = ref([]);
    const errors        = ref([]);
    const reviewsLoaded = ref(false);


    const summaries = ref({});

    const averageScore = computed(() => {
        if (!reviews.value.length) return 0;
        return +(reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1);
    });


    function fetchReviews() {
        reputationApi.getReviews().then(response => {
            reviews.value = ReviewAssembler.toEntitiesFromResponse(response);
            reviewsLoaded.value = true;
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
        return reputationApi.createReview(body).then(response => {
            const newReview = ReviewAssembler.toEntityFromResource(response.data);
            reviews.value.push(newReview);
            fetchTutorSummary(newReview.tutorId);
            return newReview;
        }).catch(error => {
            errors.value.push(error);
            return null;
        });
    }


    function fetchTutorSummary(tutorId) {
        const idNum = parseInt(tutorId);
        return reputationApi.getTutorSummary(idNum).then(response => {
            summaries.value[idNum] = response.data;
            return response.data;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function getTutorSummary(tutorId) {
        return summaries.value[parseInt(tutorId)] ?? null;
    }

    return {
        reviews, errors, reviewsLoaded,
        averageScore,
        fetchReviews, getReviewById, getReviewsByTutorId, addReview,
        fetchTutorSummary, getTutorSummary,
    };
});

export default useReputationStore;
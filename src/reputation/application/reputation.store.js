import { defineStore }        from 'pinia'
import { ref, computed }       from 'vue'
import { ReputationApi }       from '@/reputation/infrastructure/reputation-api.js'
import { ReviewAssembler }     from '@/reputation/infrastructure/review.assembler.js'
import { ReputationAssembler } from '@/reputation/infrastructure/reputation.assembler.js'
import { Review }              from '@/reputation/domain/model/review-entity.js'

const api = new ReputationApi()

const useReputationStore = defineStore('reputation', () => {

    // ── State ─────────────────────────────────────────────────
    const reviews            = ref([])
    const reputations        = ref([])
    const errors             = ref([])
    const reviewsLoaded      = ref(false)
    const reputationsLoaded  = ref(false)

    // ── Getters ───────────────────────────────────────────────
    const publishedReviews = computed(() => reviews.value.filter(r => r.isPublished()))
    const averageScore     = computed(() => {
        const pub = publishedReviews.value
        if (!pub.length) return 0
        return +(pub.reduce((s, r) => s + r.score, 0) / pub.length).toFixed(1)
    })

    // ── Reviews ───────────────────────────────────────────────
    function fetchReviews() {
        api.getReviews()
            .then(res => {
                reviews.value = ReviewAssembler.toEntitiesFromResponse(res)
                reviewsLoaded.value = true
            })
            .catch(e => errors.value.push(e))
    }

    function getReviewById(id) {
        return reviews.value.find(r => r.id === parseInt(id))
    }

    function addReview(review) {
        const body = ReviewAssembler.toResourceFromEntity(review)
        api.createReview(body)
            .then(res => reviews.value.push(ReviewAssembler.toEntityFromResource(res.data)))
            .catch(e  => errors.value.push(e))
    }

    function updateReview(review) {
        const body = ReviewAssembler.toResourceFromEntity(review)
        api.updateReview(review.id, body)
            .then(res => {
                const updated = ReviewAssembler.toEntityFromResource(res.data)
                const idx = reviews.value.findIndex(r => r.id === updated.id)
                if (idx !== -1) reviews.value[idx] = updated
            })
            .catch(e => errors.value.push(e))
    }

    function deleteReview(review) {
        api.deleteReview(review.id)
            .then(() => {
                const idx = reviews.value.findIndex(r => r.id === review.id)
                if (idx !== -1) reviews.value.splice(idx, 1)
            })
            .catch(e => errors.value.push(e))
    }

    function publishReview(review) {
        updateReview(new Review({ ...review, status: 'PUBLISHED' }))
    }

    function removeReview(review) {
        updateReview(new Review({ ...review, status: 'REMOVED' }))
    }

    // ── Reputations ───────────────────────────────────────────
    function fetchReputations() {
        api.getReputations()
            .then(res => {
                reputations.value = ReputationAssembler.toEntitiesFromResponse(res)
                reputationsLoaded.value = true
            })
            .catch(e => errors.value.push(e))
    }

    return {
        reviews, reputations, errors,
        reviewsLoaded, reputationsLoaded,
        publishedReviews, averageScore,
        fetchReviews, getReviewById,
        addReview, updateReview, deleteReview,
        publishReview, removeReview,
        fetchReputations,
    }
})

export default useReputationStore
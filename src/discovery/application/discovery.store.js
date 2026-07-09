import {DiscoveryApi} from "@/discovery/infrastructure/discovery-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {TutorAssembler} from "@/discovery/infrastructure/tutor.assembler.js";
import useReputationStore from "@/reputation/application/reputation.store.js";
import useAuthStore from "@/iam/application/auth.store.js";

const discoveryApi = new DiscoveryApi();

const useDiscoveryStore = defineStore('discovery', () => {
    const reputationStore = useReputationStore();
    const authStore = useAuthStore();

    const tutors       = ref([]);
    const errors       = ref([]);
    const tutorsLoaded = ref(false);

    // Filtros activos
    const searchQuery     = ref('');
    const filterMinRating = ref(0);
    const filterUniversity = ref('');
    const filterSkill = ref('');

    const tutorsCount = computed(() => tutorsLoaded.value ? tutors.value.length : 0);

    // Tutores filtrados según búsqueda y filtros (US05 + US06)
    const filteredTutors = computed(() => {
        let result = tutors.value;

        // US05 - Búsqueda por keyword
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase().trim();
            result = result.filter(tutor =>
                tutor.name.toLowerCase().includes(q) ||
                tutor.university.toLowerCase().includes(q) ||
                tutor.career.toLowerCase().includes(q) ||
                tutor.skills.some(skill => skill.toLowerCase().includes(q))
            );
        }

        // Solo tutores visibles (que no hayan ocultado su perfil de la búsqueda)
        result = result.filter(tutor => tutor.visible);

        // Un usuario no puede encontrarse a sí mismo como tutor (no puede pedirse una sesión a sí mismo)
        result = result.filter(tutor => tutor.userId !== authStore.user?.id);

        // US06 - Filtro por rating mínimo (usa el promedio real de Reputation, con fallback al campo estático)
        if (filterMinRating.value > 0) {
            result = result.filter(tutor => {
                const summary = reputationStore.getTutorSummary(tutor.userId);
                const rating  = summary?.averageRating ?? tutor.rating;
                return rating >= filterMinRating.value;
            });
        }

        // US06 - Filtro por universidad
        if (filterUniversity.value.trim()) {
            result = result.filter(tutor =>
                tutor.university.toLowerCase().includes(filterUniversity.value.toLowerCase())
            );
        }

        // Filtro por skill específico
        if (filterSkill.value.trim()) {
            result = result.filter(tutor =>
                tutor.skills.some(s => s.toLowerCase().includes(filterSkill.value.toLowerCase()))
            );
        }

        return result;
    });



    // Lista de universidades únicas para el dropdown de filtro
    const universities = computed(() =>
        [...new Set(tutors.value.map(t => t.university))].sort()
    );

    // Lista de cursos/habilidades únicos ya dictados por otros tutores, para el selector de "Mi Perfil"
    const uniqueSkills = computed(() =>
        [...new Set(tutors.value.flatMap(t => t.skills))].sort()
    );

    function fetchTutors() {
        discoveryApi.getTutors().then(response => {
            tutors.value = TutorAssembler.toEntitiesFromResponse(response);
            tutorsLoaded.value = true;
            console.log(tutorsLoaded.value);
            console.log(tutors.value);
        }).catch(error => {
            errors.value.push(error);
            console.log('Error fetching tutors:', error);
        });
    }

    function getTutorById(id) {
        let idNum = parseInt(id);
        return tutors.value.find(tutor => tutor['id'] === idNum);
    }

    function getTutorByUserId(userId) {
        let idNum = parseInt(userId);
        return tutors.value.find(tutor => tutor.userId === idNum);
    }

    function createTutor(resource) {
        return discoveryApi.createTutor(resource).then(response => {
            const newTutor = TutorAssembler.toEntityFromResource(response.data);
            tutors.value.push(newTutor);
            return newTutor;
        }).catch(error => {
            errors.value.push(error);
            return null;
        });
    }

    function updateTutor(resource) {
        return discoveryApi.updateTutor(resource).then(response => {
            const updatedTutor = TutorAssembler.toEntityFromResource(response.data);
            const index = tutors.value.findIndex(t => t.id === updatedTutor.id);
            if (index !== -1) tutors.value[index] = updatedTutor;
            return updatedTutor;
        }).catch(error => {
            errors.value.push(error);
            return null;
        });
    }

    function clearFilters() {
        searchQuery.value      = '';
        filterMinRating.value  = 0;
        filterUniversity.value = '';
        filterSkill.value = '';
    }

    return {
        tutors, errors,
        tutorsLoaded, tutorsCount,
        searchQuery, filterMinRating, filterUniversity, filterSkill,
        filteredTutors, universities, uniqueSkills,
        fetchTutors, getTutorById, getTutorByUserId, createTutor, updateTutor, clearFilters
    };
});

export default useDiscoveryStore;

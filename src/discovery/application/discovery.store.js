import {DiscoveryApi} from "@/discovery/infrastructure/discovery-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {TutorAssembler} from "@/discovery/infrastructure/tutor.assembler.js";

const discoveryApi = new DiscoveryApi();

const useDiscoveryStore = defineStore('discovery', () => {
    const tutors       = ref([]);
    const errors       = ref([]);
    const tutorsLoaded = ref(false);

    // Filtros activos
    const searchQuery     = ref('');
    const filterMinRating = ref(0);
    const filterUniversity = ref('');

    const tutorsCount = computed(() => tutorsLoaded.value ? tutors.value.length : 0);

    // Tutores filtrados según búsqueda y filtros (US05 + US06)
    const filteredTutors = computed(() => {
        let result = tutors.value;

        // US05 - Búsqueda por keyword (skills, nombre, universidad)
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase().trim();
            result = result.filter(tutor =>
                tutor.name.toLowerCase().includes(q) ||
                tutor.university.toLowerCase().includes(q) ||
                tutor.career.toLowerCase().includes(q) ||
                tutor.skills.some(skill => skill.toLowerCase().includes(q))
            );
        }

        // US06 - Filtro por rating mínimo
        if (filterMinRating.value > 0) {
            result = result.filter(tutor => tutor.rating >= filterMinRating.value);
        }

        // US06 - Filtro por universidad
        if (filterUniversity.value.trim()) {
            result = result.filter(tutor =>
                tutor.university.toLowerCase().includes(filterUniversity.value.toLowerCase())
            );
        }

        return result;
    });

    // Lista de universidades únicas para el dropdown de filtro
    const universities = computed(() =>
        [...new Set(tutors.value.map(t => t.university))].sort()
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

    function clearFilters() {
        searchQuery.value      = '';
        filterMinRating.value  = 0;
        filterUniversity.value = '';
    }

    return {
        tutors, errors,
        tutorsLoaded, tutorsCount,
        searchQuery, filterMinRating, filterUniversity,
        filteredTutors, universities,
        fetchTutors, getTutorById, clearFilters
    };
});

export default useDiscoveryStore;

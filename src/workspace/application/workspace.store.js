import {WorkspaceApi} from "@/workspace/infrastructure/workspace-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {SessionAssembler} from "@/workspace/infrastructure/session.assembler.js";
import {MessageAssembler} from "@/workspace/infrastructure/message.assembler.js";

const workspaceApi = new WorkspaceApi();

const useWorkspaceStore = defineStore('workspace', () => {
    const sessions = ref([]);
    const messages = ref([]);
    const errors   = ref([]);
    const sessionsLoaded = ref(false);
    const messagesLoaded = ref(false);

    const sessionsCount = computed(() => {
        return sessionsLoaded.value ? sessions.value.length : 0;
    });

    const messagesCount = computed(() => {
        return messagesLoaded.value ? messages.value.length : 0;
    });

    function fetchSessions() {
        workspaceApi.getSessions().then(response => {
            sessions.value = SessionAssembler.toEntitiesFromResponse(response);
            sessionsLoaded.value = true;
            console.log(sessionsLoaded.value);
            console.log(sessions.value);
        }).catch(error => {
            errors.value.push(error);
            console.log('Error fetching sessions:', error);
        });
    }

    function fetchMessages() {
        workspaceApi.getMessages().then(response => {
            messages.value = MessageAssembler.toEntitiesFromResponse(response);
            messagesLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function getSessionById(id) {
        let idNum = parseInt(id);
        return sessions.value.find(session => session['id'] === idNum);
    }

    function getMessagesBySessionId(sessionId) {
        let idNum = parseInt(sessionId);
        return messages.value.filter(message => message['sessionId'] === idNum);
    }

    function addSession(session) {
        workspaceApi.createSession(session).then(response => {
            const resource   = response.data;
            const newSession = SessionAssembler.toEntityFromResource(resource);
            sessions.value.push(newSession);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function addMessage(message) {
        workspaceApi.createMessage(message).then(response => {
            const resource   = response.data;
            const newMessage = MessageAssembler.toEntityFromResource(resource);
            messages.value.push(newMessage);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function updateSession(session) {
        workspaceApi.updateSession(session).then(response => {
            const resource       = response.data;
            const updatedSession = SessionAssembler.toEntityFromResource(resource);
            const index = sessions.value.findIndex(s => s['id'] === updatedSession.id);
            if (index !== -1) sessions.value[index] = updatedSession;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function updateMessage(message) {
        workspaceApi.updateMessage(message).then(response => {
            const resource       = response.data;
            const updatedMessage = MessageAssembler.toEntityFromResource(resource);
            const index = messages.value.findIndex(m => m['id'] === updatedMessage.id);
            if (index !== -1) messages.value[index] = updatedMessage;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteSession(session) {
        workspaceApi.deleteSession(session.id).then(() => {
            const index = sessions.value.findIndex(s => s['id'] === session.id);
            if (index !== -1) sessions.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteMessage(message) {
        workspaceApi.deleteMessage(message.id).then(() => {
            const index = messages.value.findIndex(m => m['id'] === message.id);
            if (index !== -1) messages.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    return {
        sessions, messages,
        errors,
        sessionsLoaded, messagesLoaded,
        sessionsCount, messagesCount,
        fetchSessions, fetchMessages,
        getSessionById, getMessagesBySessionId,
        addSession, addMessage,
        updateSession, updateMessage,
        deleteSession, deleteMessage
    };
});

export default useWorkspaceStore;

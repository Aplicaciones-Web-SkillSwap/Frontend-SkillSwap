export class BaseEndpoint {
    #api
    #path

    constructor(api, path) {
        this.#api  = api
        this.#path = path
        console.log('endpoint path:', path)
    }

    getAll()              { return this.#api.http.get(this.#path) }
    getById(id)           { return this.#api.http.get(`${this.#path}/${id}`) }
    create(resource)      { return this.#api.http.post(this.#path, resource) }
    update(id, resource)  { return this.#api.http.put(`${this.#path}/${id}`, resource) }
    delete(id)            { return this.#api.http.delete(`${this.#path}/${id}`) }
}
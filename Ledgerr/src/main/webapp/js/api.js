const API_BASE = window.location.origin + '/invoicing';

const Api = (() => {

    async function request(method, path, body = null, params = null) {
        let url = API_BASE + path;
        if (params) url += '?' + new URLSearchParams(params).toString();

        const opts = {
            method,
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        };
        if (body) opts.body = JSON.stringify(body);

        const response = await fetch(url, opts);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = {error: text};
        }

        if (!response.ok) {
            const err = new Error(data.error || `HTTP ${response.status}`);
            err.data = data;
            err.status = response.status;
            throw err;
        }
        return data;
    }

    // invoice endpoints
    const invoices = {
        list: () => request('GET', '/api/invoices'),
        search: (q) => request('GET', '/api/invoices/search', null, {q}),
        get: (id) => request('GET', `/api/invoices/${id}`),
        nextNumber: () => request('GET', '/api/invoices/next-number'),
        create: (data) => request('POST', '/api/invoices', data),
        update: (id, data) => request('PUT', `/api/invoices/${id}`, data),
        delete: (id) => request('DELETE', `/api/invoices/${id}`),
    };

    // customer endpoints
    const customers = {
        list: () => request('GET', '/api/customers'),
        search: (q) => request('GET', '/api/customers/search', null, {q}),
        get: (id) => request('GET', `/api/customers/${id}`),
        create: (data) => request('POST', '/api/customers', data),
        update: (id, data) => request('PUT', `/api/customers/${id}`, data),
        delete: (id) => request('DELETE', `/api/customers/${id}`),
    };

    return {invoices, customers};
})();

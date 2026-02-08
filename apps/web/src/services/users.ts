import api from '../lib/axios';

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'DRIVER';
    licenseNumber?: string;
}

interface UpdateUserData {
    name?: string;
    licenseNumber?: string;
    role?: 'ADMIN' | 'DRIVER';
}

export const usersApi = {
    getUsers: () => api.get('/users'),

    createUser: (data: CreateUserData) => api.post('/users', data),

    updateUser: (id: string, data: UpdateUserData) =>
        api.patch(`/users/${id}`, data),

    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

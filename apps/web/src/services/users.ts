import { api } from '../lib/axios';

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'DRIVER';
    licenseNumber?: string;
    phone?: string;
    cpf?: string;
    birthDate?: string;
    entryDate?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressNeighborhood?: string;
    addressCity?: string;
    addressState?: string;
    addressZipCode?: string;
}

interface UpdateUserData extends Partial<Omit<CreateUserData, 'password' | 'email'>> { }

export const usersApi = {
    getUsers: (search?: string) => api.get('/users', { params: { search } }),

    createUser: (data: CreateUserData) => api.post('/users', data),

    updateUser: (id: string, data: UpdateUserData) =>
        api.patch(`/users/${id}`, data),

    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

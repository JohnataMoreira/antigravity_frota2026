import { Role } from '@prisma/client';

export interface AuthenticatedUser {
    userId: string;
    organizationId: string;
    email: string;
    role: Role;
}

export interface UserRequest extends Request {
    user: AuthenticatedUser;
}

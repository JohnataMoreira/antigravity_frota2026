export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    ACCESS = 'ACCESS',
}

export enum AuditEntity {
    VEHICLE = 'Vehicle',
    USER = 'User',
    JOURNEY = 'Journey',
    MAINTENANCE = 'Maintenance',
    FUEL_ENTRY = 'FuelEntry',
    CHECKLIST = 'Checklist',
    INCIDENT = 'Incident',
    STOCK = 'Stock',
    ORGANIZATION = 'Organization',
}

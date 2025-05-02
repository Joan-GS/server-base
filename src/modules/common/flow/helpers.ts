import { InvalidDataException, NotFoundException } from './generic.errors';

export class GenericHelpers {
    /**
     * Checks if an ID has valid MongoDB ObjectId format
     * @param id ID to validate
     * @returns boolean indicating validity
     */
    static isValidMongoId(id: string): boolean {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    /**
     * Parses filters from JSON string to object
     * @param filters JSON string containing filters
     * @returns Parsed filters object
     * @throws InvalidDataException if format is not valid JSON
     */
    static parseFilters<T extends object>(filters?: string): T {
        try {
            return filters ? JSON.parse(filters) : {} as T;
        } catch {
            throw new InvalidDataException('Invalid filters format. Expected valid JSON');
        }
    }

    /**
     * Verifies if an entity exists in the database
     * @param findFunction Function that searches for the entity
     * @param entityName Entity name for error messages
     * @param id ID of the entity to verify
     * @throws NotFoundException if the entity doesn't exist
     */
    static async verifyEntityExists<T>(
        findFunction: (id: string) => Promise<T | null>,
        entityName: string,
        id: string
    ): Promise<void> {
        const entity = await findFunction(id);
        if (!entity) {
            throw new NotFoundException(entityName, id);
        }
    }
}
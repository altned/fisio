export class CreatePackageDto {
    name!: string;
    sessionCount!: number;
    totalPrice!: string;
    commissionRate?: string; // Percentage taken by platform (e.g., "30" means 30%)
}

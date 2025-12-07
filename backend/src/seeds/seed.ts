import 'dotenv/config';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { Booking } from '../domain/entities/booking.entity';
import { Package } from '../domain/entities/package.entity';
import { Therapist } from '../domain/entities/therapist.entity';
import { User } from '../domain/entities/user.entity';
import { Wallet } from '../domain/entities/wallet.entity';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

type SeedUser = {
  email: string;
  fullName: string;
  role: 'PATIENT' | 'THERAPIST' | 'ADMIN';
  isProfileComplete?: boolean;
  password?: string;
};

const seedUsers: SeedUser[] = [
  { email: 'admin@example.com', fullName: 'Admin Fisio', role: 'ADMIN', isProfileComplete: true, password: 'admin123' },
  { email: 'patient@example.com', fullName: 'Patient Demo', role: 'PATIENT', isProfileComplete: true, password: 'patient123' },
  { email: 'therapist@example.com', fullName: 'Therapist Demo', role: 'THERAPIST', isProfileComplete: true, password: 'therapist123' },
];

const seedPackages: Array<Pick<Package, 'name' | 'sessionCount' | 'totalPrice'>> = [
  { name: 'Single Session', sessionCount: 1, totalPrice: '250000' },
  { name: '4-Session Package', sessionCount: 4, totalPrice: '900000' },
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function ensureUsers(manager: EntityManager): Promise<Record<string, User>> {
  const userRepo = manager.getRepository(User);
  const existing = await userRepo.find({
    where: seedUsers.map((u) => ({ email: u.email })),
  });
  const existingByEmail = new Map(existing.map((u) => [u.email, u]));

  const created: User[] = [];
  for (const seed of seedUsers) {
    const existingUser = existingByEmail.get(seed.email);

    // Hash password
    const passwordHash = await hashPassword(seed.password || DEFAULT_PASSWORD);

    if (existingUser) {
      // Update existing user with password hash if not set
      if (!existingUser.passwordHash) {
        existingUser.passwordHash = passwordHash;
        await userRepo.save(existingUser);
      }
      created.push(existingUser);
      continue;
    }

    const user = userRepo.create({
      email: seed.email,
      fullName: seed.fullName,
      role: seed.role,
      isProfileComplete: seed.isProfileComplete ?? false,
      passwordHash,
    });
    created.push(await userRepo.save(user));
  }

  return created.reduce<Record<string, User>>((acc, user) => {
    acc[user.role] = user;
    return acc;
  }, {});
}

async function ensureTherapist(manager: EntityManager, therapistUser: User): Promise<Therapist> {
  const therapistRepo = manager.getRepository(Therapist);
  const existing = await therapistRepo.findOne({
    where: { user: { id: therapistUser.id } },
    relations: ['user'],
  });
  if (existing) {
    return existing;
  }
  const therapist = therapistRepo.create({
    user: therapistUser,
    averageRating: '0',
    totalReviews: 0,
  });
  return therapistRepo.save(therapist);
}

async function ensureWallet(manager: EntityManager, therapist: Therapist): Promise<Wallet> {
  const walletRepo = manager.getRepository(Wallet);
  const existing = await walletRepo.findOne({
    where: { therapist: { id: therapist.id } },
    relations: ['therapist'],
  });
  if (existing) {
    return existing;
  }
  const wallet = walletRepo.create({
    therapist,
    balance: '0',
  });
  return walletRepo.save(wallet);
}

async function ensurePackages(manager: EntityManager): Promise<Package[]> {
  const packageRepo = manager.getRepository(Package);
  const existing = await packageRepo.find({
    where: seedPackages.map((p) => ({ name: p.name })),
  });
  const existingByName = new Map(existing.map((p) => [p.name, p]));

  const created: Package[] = [];
  for (const seed of seedPackages) {
    if (existingByName.has(seed.name)) {
      created.push(existingByName.get(seed.name)!);
      continue;
    }
    const pkg = packageRepo.create(seed);
    created.push(await packageRepo.save(pkg));
  }
  return created;
}

async function main() {
  const dataSource = await AppDataSource.initialize();
  try {
    await dataSource.transaction(async (trx: EntityManager) => {
      const users = await ensureUsers(trx);
      const therapist = await ensureTherapist(trx, users.THERAPIST);
      await ensureWallet(trx, therapist);
      await ensurePackages(trx);

      // Avoid unused warning
      void users;
      void therapist;
    });

    // eslint-disable-next-line no-console
    console.log('Seed berhasil dijalankan.');
    console.log('\nDefault credentials:');
    console.log('  Admin:     admin@example.com / admin123');
    console.log('  Patient:   patient@example.com / patient123');
    console.log('  Therapist: therapist@example.com / therapist123');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Seed gagal:', err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

main();

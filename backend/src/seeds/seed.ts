import 'dotenv/config';
import { DataSource, EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Booking } from '../domain/entities/booking.entity';
import { Package } from '../domain/entities/package.entity';
import { Therapist } from '../domain/entities/therapist.entity';
import { User } from '../domain/entities/user.entity';
import { Wallet } from '../domain/entities/wallet.entity';

type SeedUser = {
  email: string;
  fullName: string;
  role: 'PATIENT' | 'THERAPIST' | 'ADMIN';
  isProfileComplete?: boolean;
};

const seedUsers: SeedUser[] = [
  { email: 'admin@example.com', fullName: 'Admin Fisio', role: 'ADMIN', isProfileComplete: true },
  { email: 'patient@example.com', fullName: 'Patient Demo', role: 'PATIENT', isProfileComplete: true },
  { email: 'therapist@example.com', fullName: 'Therapist Demo', role: 'THERAPIST', isProfileComplete: true },
];

const seedPackages: Array<Pick<Package, 'name' | 'sessionCount' | 'totalPrice'>> = [
  { name: 'Single Session', sessionCount: 1, totalPrice: '250000' },
  { name: '4-Session Package', sessionCount: 4, totalPrice: '900000' },
];

async function ensureUsers(manager: EntityManager): Promise<Record<string, User>> {
  const userRepo = manager.getRepository(User);
  const existing = await userRepo.find({
    where: seedUsers.map((u) => ({ email: u.email })),
  });
  const existingByEmail = new Map(existing.map((u) => [u.email, u]));

  const created: User[] = [];
  for (const seed of seedUsers) {
    if (existingByEmail.has(seed.email)) {
      created.push(existingByEmail.get(seed.email)!);
      continue;
    }
    const user = userRepo.create({
      email: seed.email,
      fullName: seed.fullName,
      role: seed.role,
      isProfileComplete: seed.isProfileComplete ?? false,
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Seed gagal:', err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

main();

import 'dotenv/config';
import { AppDataSource } from '../config/data-source';
import { User } from '../domain/entities/user.entity';

async function main() {
  const ds = await AppDataSource.initialize();
  try {
    const users = await ds.getRepository(User).find({ select: ['id', 'email', 'role'] });
    console.table(users);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  } finally {
    await ds.destroy();
  }
}

main();

import { ChatLockService } from './chat-lock.service';

describe('ChatLockService', () => {
  it('should lock chats and return affected ids', async () => {
    const selectBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
    };
    const updateBuilder = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    const dataSource: any = {
      getRepository: () => ({
        createQueryBuilder: () => selectBuilder,
      }),
      createQueryBuilder: () => ({
        update: () => updateBuilder,
      }),
    };

    const svc = new ChatLockService(dataSource);
    const ids = await svc.lockChats();

    expect(ids).toEqual(['b1', 'b2']);
    expect(updateBuilder.execute).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { EmissionFactorsService } from '../carbon-logs/emission-factors.service';
import { GreenCriteriaService } from '../assessments/green-criteria.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationsRepo: any;
  let mockUsersService: any;
  let mockMailService: any;

  beforeEach(async () => {
    mockNotificationsRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 1, title: 'Alert', is_read: false }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, title: 'Alert', is_read: false }),
      count: jest.fn().mockResolvedValue(3),
      create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      save: jest.fn().mockImplementation((n) => Promise.resolve(n)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    mockUsersService = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 1, email: 'admin@example.com' }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'user@example.com' }),
    };

    mockMailService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationsRepo,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
        { provide: EmissionFactorsService, useValue: {} },
        { provide: GreenCriteriaService, useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should get unread count', async () => {
    const count = await service.getUnreadCount(1);
    expect(count).toBe(3);
    expect(mockNotificationsRepo.count).toHaveBeenCalledWith({
      where: { recipient_id: 1, is_read: false },
    });
  });

  it('should mark a notification as read', async () => {
    const notification = await service.markAsRead(1, 10);
    expect(notification.is_read).toBe(true);
    expect(mockNotificationsRepo.save).toHaveBeenCalled();
  });

  it('should find notifications for user with pagination', async () => {
    const list = await service.findAllForUser(10, 1, 20);
    expect(mockNotificationsRepo.find).toHaveBeenCalledWith({
      where: { recipient_id: 10 },
      order: { created_at: 'DESC' },
      skip: 0,
      take: 20,
    });
    expect(list).toHaveLength(1);
  });
});

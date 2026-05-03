import { BadRequestException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { UpdateSprintRatingItemInput } from '../dto/update-sprint-rating.input';

describe('RatingsService updateSprintRatingRequests', () => {
  const createService = () => {
    const queryMock = jest.fn().mockResolvedValue([]);
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (work) => work({ query: queryMock })),
    } as any;

    const service = new RatingsService(
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      dataSource,
      null as any,
      null as any,
      null as any,
    );

    return { service, dataSource, queryMock };
  };

  it('throws when the payload is empty', async () => {
    const { service } = createService();

    await expect(service.updateSprintRatingRequests([])).rejects.toThrow(
      new BadRequestException('No sprint rating updates provided'),
    );
  });

  it('throws when all items are invalid or empty', async () => {
    const { service } = createService();

    const updates: UpdateSprintRatingItemInput[] = [
      { sprId: 'c0000000-0000-0000-0000-000000000000', rating: 0 },
      { sprId: '', rating: 5 },
    ];

    await expect(service.updateSprintRatingRequests(updates)).rejects.toThrow(
      new BadRequestException(
        'At least one valid sprint rating update item with spr_id is required',
      ),
    );
  });

  it('calls the DB function with valid items and skips invalid entries', async () => {
    const { service, dataSource, queryMock } = createService();

    const updates: UpdateSprintRatingItemInput[] = [
      {
        sprId: '50000000-0000-0000-0000-000000000001',
        rating: 8,
        answer: 'Good contribution',
      },
      {
        sprId: '60000000-0000-0000-0000-000000000001',
        rating: 12,
        answer: 'Invalid rating',
      },
      {
        sprId: '70000000-0000-0000-0000-000000000001',
      },
    ];

    const result = await service.updateSprintRatingRequests(updates);

    expect(result).toEqual({
      status: 'success',
      message: 'Sprint ratings updated successfully',
    });
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT public.update_sprint_rating_request($1::jsonb)',
      [
        JSON.stringify([
          {
            spr_id: '50000000-0000-0000-0000-000000000001',
            rating: 8,
            answer: 'Good contribution',
          },
          {
            spr_id: '70000000-0000-0000-0000-000000000001',
            rating: undefined,
            answer: undefined,
          },
        ]),
      ],
    );
  });

  it('allows items with only spr_id (no rating or answer)', async () => {
    const { service, dataSource, queryMock } = createService();

    const updates: UpdateSprintRatingItemInput[] = [
      {
        sprId: '80000000-0000-0000-0000-000000000001',
      },
    ];

    const result = await service.updateSprintRatingRequests(updates);

    expect(result).toEqual({
      status: 'success',
      message: 'Sprint ratings updated successfully',
    });
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT public.update_sprint_rating_request($1::jsonb)',
      [
        JSON.stringify([
          {
            spr_id: '80000000-0000-0000-0000-000000000001',
            rating: undefined,
            answer: undefined,
          },
        ]),
      ],
    );
  });
});

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SprintRatingSummaryOutput, CategoryRatingOutput } from '../dto/sprint-rating-summary.output';

interface RatingRow {
  sprint_id: string;
  sprint_name: string;
  project_id: string;
  project_name: string;
  category_id: string | null;
  category_name: string | null;
  avg_rating: string;
}

@Injectable()
export class RatingSummaryService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  async getSprintRatingSummary(
    userId: string,
    projectId?: string,
    sprintId?: string,
    categoryId?: string,
  ): Promise<SprintRatingSummaryOutput[]> {
    if (!this.isUuid(userId)) {
      return [];
    }

    const rows: RatingRow[] = await this.dataSource.query(
      `
      SELECT
        spm.sprint_id,
        s.name                                    AS sprint_name,
        spm.project_id,
        p.name                                    AS project_name,
        qc.id                                     AS category_id,
        qc.name                                   AS category_name,
        ROUND(AVG(spmr.rating)::numeric, 2)       AS avg_rating
      FROM sprint_project_member_rating spmr
      JOIN sprint_project_member  spm ON spm.id  = spmr.sprint_project_member_id
      JOIN sprints                s   ON s.id    = spm.sprint_id
      JOIN projects               p   ON p.id    = spm.project_id
      JOIN questions              q   ON q.id    = spmr.question_id
      LEFT JOIN question_category qc  ON qc.id   = q.category_id
      WHERE spmr.rating_by_user_id = $1
        AND spm.is_active          = true
        AND spmr.rating            IS NOT NULL
        AND ($2::uuid IS NULL OR spm.project_id = $2)
        AND ($3::uuid IS NULL OR spm.sprint_id  = $3)
        AND ($4::uuid IS NULL OR q.category_id  = $4)
      GROUP BY spm.sprint_id, s.name, spm.project_id, p.name, qc.id, qc.name
      ORDER BY s.name DESC, qc.name ASC
      `,
      [userId, projectId ?? null, sprintId ?? null, categoryId ?? null],
    );

    return this.groupBySprint(rows);
  }

  private groupBySprint(rows: RatingRow[]): SprintRatingSummaryOutput[] {
    const map = new Map<string, SprintRatingSummaryOutput>();

    for (const row of rows) {
      const key = `${row.sprint_id}::${row.project_id}`;

      if (!map.has(key)) {
        map.set(key, {
          sprintId: row.sprint_id,
          sprintName: row.sprint_name,
          projectId: row.project_id,
          projectName: row.project_name,
          overallRating: 0,
          categories: [],
        });
      }

      const entry = map.get(key)!;
      const avgRating = Number(row.avg_rating);

      const category: CategoryRatingOutput = {
        categoryId: row.category_id,
        categoryName: row.category_name,
        averageRating: avgRating,
      };

      entry.categories.push(category);
    }

    // Compute overallRating as average of all category averages per sprint
    for (const entry of map.values()) {
      const sum = entry.categories.reduce((acc, c) => acc + c.averageRating, 0);
      entry.overallRating = entry.categories.length > 0
        ? Number((sum / entry.categories.length).toFixed(2))
        : 0;
    }

    return Array.from(map.values());
  }
}

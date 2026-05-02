import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Rating } from "./rating.entity";
import { AggregatedRating } from "./aggregated-rating.entity";
import { Question } from "./question.entity";

@ObjectType()
@Entity("sprints")
export class Sprint {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: "date", name: "start_date" })
  startDate: string;

  @Field()
  @Column({ type: "date", name: "end_date" })
  endDate: string;

  @OneToMany(() => Rating, (rating) => rating.sprint)
  ratings: Rating[];

  @OneToMany(() => AggregatedRating, (rating) => rating.sprint)
  aggregatedRatings: AggregatedRating[];

  @OneToMany(() => Question, (question) => question.sprint)
  questions: Question[];
}

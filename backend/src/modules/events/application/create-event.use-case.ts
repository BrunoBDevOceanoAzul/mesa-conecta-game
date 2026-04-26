import { UseCase } from "../../../shared/domain/use-case.js";
import { Event } from "../domain/event.js";
import { EventRepository, CreateEventInput } from "../domain/event-repository.js";

export class CreateEventUseCase implements UseCase<CreateEventInput, Event> {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: CreateEventInput): Promise<Event> {
    return this.eventRepository.create(input);
  }
}

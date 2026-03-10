export class CreateRoomDto {
  readonly title: string;
  readonly bookUrl: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

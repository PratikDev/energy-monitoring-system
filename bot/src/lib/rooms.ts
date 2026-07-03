export type RoomId = "drawing" | "work1" | "work2";

const ROOM_LABELS: Record<RoomId, string> = {
  drawing: "Drawing Room",
  work1: "Work Room 1",
  work2: "Work Room 2",
};

const ROOM_ALIASES: Record<string, RoomId> = {
  draw: "drawing",
  drawing: "drawing",
  "drawing room": "drawing",
  "room 1": "work1",
  "room 2": "work2",
  work1: "work1",
  "work 1": "work1",
  "work room 1": "work1",
  work2: "work2",
  "work 2": "work2",
  "work room 2": "work2",
};

export function parseRoom(input: string): RoomId | null {
  const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, " ");
  return ROOM_ALIASES[normalizedInput] ?? null;
}

export function getRoomLabel(room: RoomId): string {
  return ROOM_LABELS[room];
}

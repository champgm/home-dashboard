export enum GroupClass {
  ATTIC = "Attic",
  BALCONY = "Balcony",
  BARBECUE = "Barbecue",
  BATHROOM = "Bathroom",
  BEDROOM = "Bedroom",
  CARPORT = "Carport",
  CLOSET = "Closet",
  COMPUTER = "Computer",
  DINING = "Dining",
  DOWNSTAIRS = "Downstairs",
  DRIVEWAY = "Driveway",
  FRONT_DOOR = "Front door",
  GARAGE = "Garage",
  GARDEN = "Garden",
  GUEST_ROOM = "Guest room",
  GYM = "Gym",
  HALLWAY = "Hallway",
  HOME = "Home",
  KIDS_BEDROOM = "Kids bedroom",
  KITCHEN = "Kitchen",
  LAUNDRY_ROOM = "Laundry room",
  LIVING_ROOM = "Living room",
  LOUNGE = "Lounge",
  MAN_CAVE = "Man cave",
  MUSIC = "Music",
  NURSERY = "Nursery",
  OFFICE = "Office",
  OTHER = "Other",
  POOL = "Pool",
  PORCH = "Porch",
  READING = "Reading",
  RECREATION = "Recreation",
  STAIRCASE = "Staircase",
  STORAGE = "Storage",
  STUDIO = "Studio",
  TERRACE = "Terrace",
  TOILET = "Toilet",
  TOP_FLOOR = "Top floor",
  TV = "TV",
  UPSTAIRS = "Upstairs",
}

export function verify(groupClass: GroupClass): GroupClass {
  if (!Object.values(GroupClass).includes(groupClass)) {
    throw new Error(`GroupClass, '${groupClass}' ` +
      `is not a valid GroupClass. ` +
      `Valid GroupClasses: ${JSON.stringify(GroupClass)}`);
  }
  return groupClass;
}

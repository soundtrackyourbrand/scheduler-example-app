export type Account = {
  id: string;
  businessName: string;
};

export type Location = {
  id: string;
  name: string;
};

export type AccountZone = {
  id: string;
  name: string;
  location: Location | null;
};

export type Zone = {
  id: string;
  name: string;
  account: { id: string };
  location: Location | null;
};

export type AccountLibrary = {
  playlists: Assignable[];
  schedules: Assignable[];
};

export type Assignable = {
  kind: string;
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  token: string;
  expiresAt: Date;
  refreshToken: string;
};

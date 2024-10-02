import pino from "pino";
import { runMutation, runQuery } from "./client.js";
import {
  Account,
  AccountLibrary,
  AccountZone,
  Assignable,
  Zone,
} from "./types.js";

const logger = pino();

export class Api {
  async getAccounts(): Promise<Account[]> {
    logger.info("Getting accounts");
    const res = await runQuery<AccountsQuery, AccountsQueryArgs>(
      accountsQuery,
      undefined,
    );
    return res.data.me.accounts.edges.map(({ node }) => node);
  }
  async getAccount(accountId: string): Promise<Account> {
    logger.info(`Getting accounts ${accountId}`);
    const res = await runQuery<AccountQuery, AccountQueryArgs>(accountQuery, {
      id: accountId,
    });
    return res.data.account;
  }
  async getAccountZones(accountId: string): Promise<Zone[]> {
    logger.info(`Getting zones for account ${accountId}`);
    return await this.getAccountZonesPage(accountId, null, []);
  }
  private async getAccountZonesPage(
    accountId: string,
    cursor: string | null,
    acc: Zone[],
  ): Promise<Zone[]> {
    logger.info(`Getting zones for account ${accountId} from cursor ${cursor}`);
    const res = await runQuery<AccountZonesQuery, AccountZonesQueryArgs>(
      accountZonesQuery,
      {
        id: accountId,
        cursor,
      },
    );
    const zoneFn = toZoneFn(accountId);
    const zones: Zone[] = acc.concat(
      res.data.account.soundZones.edges.map(({ node }) => zoneFn(node)),
    );
    const pageInfo = res.data.account.soundZones.pageInfo;
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      return this.getAccountZonesPage(accountId, pageInfo.endCursor, zones);
    } else {
      return zones;
    }
  }
  async getZone(zoneId: string): Promise<Zone> {
    logger.info(`Getting zone ${zoneId}`);
    const res = await runQuery<ZoneQuery, ZoneQueryArgs>(zoneQuery, {
      id: zoneId,
    });
    return res.data.soundZone;
  }
  async getZones(): Promise<Zone[]> {
    logger.info(`Getting zones`);
    const accounts = await this.getAccounts();
    const zones = await Promise.all(
      accounts.map((account) => this.getAccountZones(account.id)),
    );
    return zones.flat();
  }
  async assignMusic(zoneId: string, playFromId: string): Promise<void> {
    logger.info(`Assigning ${playFromId} to ${zoneId}`);
    await runMutation<AssignMutation, AssignMutationArgs>(assignMutation, {
      zoneId,
      playFromId,
    });
  }
  async getAssignable(assignableId: string): Promise<Assignable | null> {
    logger.info(`Getting assignable ${assignableId}`);
    const res = await runQuery<AssignableQuery, AssignableQueryArgs>(
      assignableQuery,
      { assignableId },
      { errorPolicy: "all" },
    );
    if (!res.data) {
      logger.info("Failed to get assignable: " + res.errors);
      throw new Error("GraphQL request returned errors");
    }
    const item = res.data.playlist ?? res.data.schedule;
    return item ? toAssignable(item) : null;
  }
  async getLibrary(accountId: string): Promise<AccountLibrary> {
    logger.info(`Getting library ${accountId}`);
    const res = await this.getLibraryPage(
      accountId,
      { playlists: null, schedules: null },
      { playlists: [], schedules: [] },
    );
    return res;
  }
  private async getLibraryPage(
    accountId: string,
    opts: LibraryPageOpts,
    acc: AccountLibrary,
  ): Promise<AccountLibrary> {
    const res = await runQuery<LibraryQuery, LibraryQueryArgs>(libraryQuery, {
      accountId,
      playlists: opts.playlists !== false,
      playlistCursor: libraryOptToCursor(opts.playlists),
      schedules: opts.schedules !== false,
      scheduleCursor: libraryOptToCursor(opts.schedules),
    });

    const musicLibrary = res.data.account.musicLibrary;
    const playlists: Assignable[] =
      musicLibrary.playlists?.edges.map(toAssignableNode) ?? [];
    const schedules: Assignable[] =
      musicLibrary.schedules?.edges.map(toAssignableNode) ?? [];

    const nextOpts: LibraryPageOpts = {
      playlists: libraryOptFromPageInfo(musicLibrary.playlists?.pageInfo),
      schedules: libraryOptFromPageInfo(musicLibrary.schedules?.pageInfo),
    };

    const library: AccountLibrary = {
      playlists: acc.playlists.concat(playlists),
      schedules: acc.schedules.concat(schedules),
    };

    if (libraryPageOptsIsEmpty(nextOpts)) {
      return library;
    }

    return this.getLibraryPage(accountId, nextOpts, library);
  }
}

type LibraryPageOpts = {
  playlists: boolean | string | null;
  schedules: boolean | string | null;
};

function libraryPageOptsIsEmpty(opts: LibraryPageOpts): boolean {
  return opts.playlists === false && opts.schedules === false;
}

function libraryOptToCursor(opt: boolean | string | null): string | null {
  if (typeof opt === "boolean") return null;
  return opt;
}

function libraryOptFromPageInfo(
  pageInfo: PageInfo | undefined,
): boolean | string {
  if (!pageInfo) return false;
  return pageInfo.hasNextPage && pageInfo.endCursor
    ? pageInfo.endCursor
    : false;
}

function toZoneFn(accountId: string) {
  return function toZone(zone: AccountZone): Zone {
    return { ...zone, account: { id: accountId } };
  };
}

function toAssignableNode(node: MusicLibraryNode): Assignable {
  return toAssignable(node.node);
}

function toAssignable(item: LibraryItem): Assignable {
  const imageUrl = item.display.image.sizes.thumbnail;
  return {
    kind: item.__typename,
    id: item.id,
    name: item.name,
    imageUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

type AccountsQuery = {
  me: {
    accounts: {
      edges: {
        node: Account;
      }[];
    };
  };
};

type AccountsQueryArgs = undefined;

const accountsQuery = `
query SchedulerAccounts {
  me {
    ... on PublicAPIClient {
      accounts(first: 500) {
        edges {
          node {
            id
            businessName
          }
        }
      }
    }
  }
}
`;

type AccountQuery = {
  account: Account;
};

type AccountQueryArgs = {
  id: string;
};

const accountQuery = `
query SchedulerAccount($id: ID!) {
  account(id: $id) {
    id
    businessName
  }
}
`;

type AccountZonesQuery = {
  account: {
    id: string;
    soundZones: {
      pageInfo: PageInfo;
      edges: {
        node: AccountZone;
      }[];
    };
  };
};

type AccountZonesQueryArgs = {
  id: string;
  cursor: string | null;
};

const accountZonesQuery = `
query Scheduler_Zones($id: ID!, $cursor: String) {
  account(id: $id) {
    id
    soundZones(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          location {
            id
            name
          }
        }
      }
    }
  }
}
`;

type ZoneQuery = {
  soundZone: Zone;
};

type ZoneQueryArgs = {
  id: string;
};

const zoneQuery = `
query Scheduler_Zone($id: ID!) {
  soundZone(id: $id) {
    id
    name
    location {
      id
      name
    }
    account {
      id
    }
  }
}
`;
type LibraryItem = {
  __typename: string;
  id: string;
  name: string;
  display: {
    image: {
      sizes: {
        thumbnail: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
};

type MusicLibraryNode = {
  node: LibraryItem;
};

type MusicLibrary = {
  playlists?: {
    pageInfo: PageInfo;
    edges: MusicLibraryNode[];
  };
  schedules?: {
    pageInfo: PageInfo;
    edges: MusicLibraryNode[];
  };
};

const displayFragment = `
fragment DisplayFragment on Displayable {
  display { image { sizes { thumbnail }}}
}
`;

const playlistFragment = `
fragment PlaylistFragment on Playlist {
  __typename
  id
  name
  createdAt
  updatedAt
  ...DisplayFragment
}
`;

const scheduleFragment = `
fragment ScheduleFragment on Schedule {
  __typename
  id
  name
  createdAt
  updatedAt
  ...DisplayFragment
}
`;

type LibraryQuery = {
  account: {
    musicLibrary: MusicLibrary;
  };
};

type LibraryQueryArgs = {
  accountId: string;
  playlistCursor: string | null;
  playlists: boolean;
  scheduleCursor: string | null;
  schedules: boolean;
};

const libraryQuery = `
${displayFragment}
${playlistFragment}
${scheduleFragment}
query Scheduler_Library(
  $accountId: ID!
  $playlistCursor: String
  $playlists: Boolean!
  $scheduleCursor: String
  $schedules: Boolean!
) {
  account(id: $accountId) {
    musicLibrary {
      playlists(first:1000, after: $playlistCursor) @include(if: $playlists) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...PlaylistFragment
          }
        }
      }
      schedules(first:1000, after: $scheduleCursor) @include(if: $schedules) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...ScheduleFragment
          }
        }
      }
    }
  }
}`;

type AssignMutation = {
  soundZones: string[];
};

type AssignMutationArgs = {
  zoneId: string;
  playFromId: string;
};

const assignMutation = `
mutation Scheduler_Assign($zoneId: ID!, $playFromId: ID!) {
  soundZoneAssignSource(input: { soundZones: [$zoneId], source: $playFromId }) {
    soundZones
  }
}
`;

type AssignableQuery = {
  playlist: LibraryItem | null;
  schedule: LibraryItem | null;
};

type AssignableQueryArgs = {
  assignableId: string;
};

const assignableQuery = `
${displayFragment}
${playlistFragment}
${scheduleFragment}
query Scheduler_Assignable($assignableId: ID!) {
  playlist: playlist(id: $assignableId) {
    ...PlaylistFragment
  }
  schedule: schedule(id: $assignableId) {
    ...ScheduleFragment
  }
}
`;

type PageInfo = {
  hasNextPage: boolean;
  endCursor?: string | null;
};

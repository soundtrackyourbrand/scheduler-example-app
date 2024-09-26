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
    const res = await runQuery<AccountsQuery>(accountsQuery, {});
    return res.data.me.accounts.edges.map(({ node }) => node);
  }
  async getAccount(accountId: string): Promise<Account> {
    const res = await runQuery<AccountQuery>(accountQuery, { id: accountId });
    return res.data.account;
  }
  async getAccountZones(accountId: string): Promise<Zone[]> {
    return await this.getAccountZonesPage(accountId, null, []);
  }
  private async getAccountZonesPage(
    accountId: string,
    cursor: string | null,
    acc: Zone[],
  ): Promise<Zone[]> {
    const res = await runQuery<AccountZonesQuery>(accountZonesQuery, {
      id: accountId,
      cursor,
    });
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
    const res = await runQuery<ZoneQuery>(zoneQuery, { id: zoneId });
    return res.data.soundZone;
  }
  async getZones(): Promise<Zone[]> {
    const accounts = await this.getAccounts();
    const zones = await Promise.all(
      accounts.map((account) => this.getAccountZones(account.id)),
    );
    return zones.flat();
  }
  async assignMusic(zoneId: string, playFromId: string): Promise<void> {
    await runMutation<AssignMutation>(assignMutation, { zoneId, playFromId });
  }
  async getAssignable(assignableId: string): Promise<Assignable | null> {
    const res = await runQuery<AssignableQuery>(
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
    const res = await runQuery<LibraryQuery>(libraryQuery, { accountId });
    const playlists: Assignable[] =
      res.data.account.musicLibrary.playlists.edges.map(toAssignableNode);
    const schedules: Assignable[] =
      res.data.account.musicLibrary.schedules.edges.map(toAssignableNode);
    return {
      playlists,
      schedules,
    };
  }
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
  playlists: {
    edges: MusicLibraryNode[];
  };
  schedules: {
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

const libraryQuery = `
${displayFragment}
${playlistFragment}
${scheduleFragment}
query Scheduler_Library($accountId: ID!) {
  account(id: $accountId) {
    musicLibrary {
      playlists(first:1000) {
        edges {
          node {
            ...PlaylistFragment
          }
        }
      }
      schedules(first:1000) {
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

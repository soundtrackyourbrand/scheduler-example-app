# Soundtrack Scheduler

The Soundtrack Scheduler app lets you manage _Events_ that will assign music to one or many _Zones_ using the Soundtrack API.

## Gettings started

- Install dependencies `npm install`, `yarn install` or `pnpm install` (this documentation will use `pnpm` for the following examples)
- Start a database of choice that is supported by [Sequelize](https://sequelize.org/). See more in the [Database setup](#database-setup) instructions.
- Configure your `.env` file. The `.env.sample` file contains the neccessary fields to make requests to the Soundtrack API. See more in [Soundtrack API configuration](#soundtrack-api-configuration).
- Start the app with `SYNC_DB=true pnpm dev`. If all goes well the app is running on [localhost:5173](http://localhost:5173).
  - _Note: `SYNC_DB=true` will flush and re-create your database, only use it the first time you start the app or after changes to the database schema._

## Development

This project is based on [Remix.run](https://remix.run/), a full stack web framework that allows us to serve both a React app and server endpoints easily.

### Project setup

The app is split up in mainly two parts:

1. The Remix UI, routes and React components (located in `./app`)
1. The server that serves both the Remix app and the API endpoints (located in `./server.ts`)
1. The worker that checks what events needs to be acted upon and calls the Soundtrack API.

### UI components

This project uses [shadcn/ui](https://ui.shadcn.com) for UI components. To add a new component to the project run `pnpm shadcn add <component name>`.

New components are added to `app/components/ui/<components name>.tsx` and can be referenced as `~/components/ui/<component name>.tsx` in other parts of the app.

### Client data fetching

This project uses [SWR](https://swr.vercel.app/) for data fetching.

## Database setup

You are required to provide your own database to be able to manage _Events_. We are using the [Sequelize](https://sequelize.org/) ORM which comes with full support for Oracle, Postgres, MySQL, MariaDB, SQLite and SQL Server, and more.

To get up and running quickly `sqlite` is installed and will create `db.sqlite` when the app starts.

To configure your database, edit `./lib/db/index.ts`.

## Soundtrack API configuration

In order to make requests to the Soundtrack API you will need to provide the app with an API token. The API will only let you see and take actions on the accounts and zones that you have configured.

The `.env.sample` file contains the required fields to make requests to the Soundtrack API.

```shell
cp .env.sample .env
# Add your token to the .env file
```

## Deployment

### Security

This app does not enforce any authentication, **do not put this app on the internet**.

### Building

The app contains two moving parts as described in [Project setup](#project-setup): the user facing React app and the server. These two needs to be built separately. To produce JavaScript files that can be run with plain `node` you can run the follwing two scrips defined in `package.json`.

* `pnpm build:remix` Builds the React app and puts the final output in `./build`.
* `pnpm build:server` Builds the server and puts it in `./build-server`. This step depends on the `pnpm build:remix` step.

After successfully running the commands above the app can be started with

```shell
node ./build-server/server.js
```

### App container

Every running environment is different, but to help getting this app deployed `./example.Dockerfile` will produce an image that runs the app.

```shell
$ docker build -t localhost/soundtrack-scheduler:dev -f example.Dockerfile .
...
Successfully tagged localhost/soundtrack-scheduler:dev
$ docker run -p 5173:5173 -v $(pwd)/.env:/app/.env --env "SYNC_DB=true" -it localhost/soundtrack-scheduler:dev
```

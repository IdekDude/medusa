import inquirer from "inquirer"
import { Ora } from "ora"
import { EOL } from "os"
import pg from "pg"
import formatConnectionString from "./format-connection-string.js"
import { getCurrentOs } from "./get-current-os.js"
import logMessage from "./log-message.js"
import postgresClient from "./postgres-client.js"

type CreateDbOptions = {
  client: pg.Client
  db: string
}

export default async function createDb({ client, db }: CreateDbOptions) {
  await client.query(`CREATE DATABASE "${db}"`)
}

export async function runCreateDb({
  client,
  dbName,
  spinner,
}: {
  client: pg.Client
  dbName: string
  spinner: Ora
}) {
  // create postgres database
  try {
    await createDb({
      client,
      db: dbName,
    })
  } catch (e) {
    spinner.stop()
    logMessage({
      message: `An error occurred while trying to create your database: ${e}`,
      type: "error",
    })
  }
}

export async function getDbClientAndCredentials(dbName: string): Promise<{
  client: pg.Client
  dbConnectionString: string
}> {
  let client!: pg.Client
  let postgresUsername = "postgres"
  let postgresPassword = ""

  try {
    client = await postgresClient({
      user: postgresUsername,
      password: postgresPassword,
    })
  } catch (e) {
    // ask for the user's postgres credentials
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "postgresUsername",
        message: "Enter your Postgres username",
        default: "postgres",
        validate: (input) => {
          return typeof input === "string" && input.length > 0
        },
      },
      {
        type: "password",
        name: "postgresPassword",
        message: "Enter your Postgres password",
      },
    ])

    postgresUsername = answers.postgresUsername
    postgresPassword = answers.postgresPassword

    try {
      client = await postgresClient({
        user: postgresUsername,
        password: postgresPassword,
      })
    } catch (e) {
      logMessage({
        message: `Couldn't connect to PostgreSQL. Make sure you have PostgreSQL installed and the credentials you provided are correct.${EOL}${EOL}You can learn how to install PostgreSQL here: https://docs.medusajs.com/development/backend/prepare-environment?os=${getCurrentOs()}#postgresql${EOL}${EOL}If you keep running into this issue despite having PostgreSQL installed, please check out our troubleshooting guidelines: https://docs.medusajs.com/troubleshooting/database-error`,
        type: "error",
      })
    }
  }

  // format connection string
  const dbConnectionString = formatConnectionString({
    user: postgresUsername,
    password: postgresPassword,
    host: client!.host,
    db: dbName,
  })

  return {
    client,
    dbConnectionString,
  }
}

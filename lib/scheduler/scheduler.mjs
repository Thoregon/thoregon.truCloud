// scheduler.js
// Node.js ES6 scheduler with persistence in DuckDB, using Temporal and a minute-based loop
// Includes a registry for task functions
// -----------------------------------------

// If running on Node ≥20, Temporal is built-in; otherwise install '@js-temporal/polyfill'
import { Temporal } from 'temporal-polyfill';
import cronParser from 'cron-parser';

// Initialize DuckDB (persistent file 'schedules.db')
// const db = new Database('schedules.db');
// const conn = db.connect();
/*

// Create table for schedules
CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR,                    -- name, used only for repeating schedules to check it already defined
      type VARCHAR NOT NULL,           -- 'repeating', 'next', or 'retry'
      function_id VARCHAR NOT NULL,    -- reference to registered function
      expression VARCHAR NOT NULL,     -- cron expression or descriptor JSON
      next_run TIMESTAMP,              -- next scheduled run (UTC)
      payload JSON,                    -- parameters for the task function
      retries_left INTEGER,            -- for retry schedules
      retry_plan JSON,                 -- array of intervals (in seconds)
      last_run TIMESTAMP,              -- when it was last executed (UTC)
      last_error VARCHAR,              -- last error message if task failed
      created_at TIMESTAMP DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
      updated_at TIMESTAMP DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
      executed BOOLEAN DEFAULT FALSE   -- whether a one-off or retry-completed run was executed
)
*/

const timezone = "UTC"
// const cronTZ   = 'Europe/Berlin';

class Scheduler {
    constructor() {
        this.timezone = timezone; // adjust if needed
        this.isRunning = false;
        this.registry = new Map(); // function_id => function
    }

    // Register a function to be used by tasks
    register(functionId, fn) {
        this.registry.set(functionId, fn);
    }

    useHome(home) {
        this.home = home;
    }

    // Initialize: start loop only
    async init() {
        if (!this.isRunning) {
            this.isRunning = true;
            this._scheduleNextTick();
        }
    }

    getOlap() {
        if (!this._olap) {
            const olap = this.home.olap;
            this._olap = olap;
        }
        return this._olap;
    }

    async exists(name){
        const olap = this.getOlap();
        const res = await olap.query('SELECT * FROM schedules WHERE name = ?', [name]);
        return res.rows.length > 0;
    }

    async dropByName(name){
        const olap = this.getOlap();
        const res = await olap.query('DELETE FROM schedules WHERE name = ?', [name]);
        return true; // res.rows;
    }

    async dropById(id){
        const olap = this.getOlap();
        const res = await olap.query('DELETE FROM schedules WHERE scheduleid = ?', [id]);
        return true; // res.rows;
    }

    // Run missed tasks (call separately)
    async runMissedTasks() {
        try {
            const olap   = this.getOlap();
            const nowISO = Temporal.Now.instant().toString();
            const res    = await olap.query(
                `SELECT * FROM schedules WHERE next_run <= ? AND (type <> 'repeating' OR executed = false)`,
                [nowISO]
            );
            const rows   = res.rows;
            for (const row of rows) {
                await this._runJob(row, { isMissed: true });
            }
        } catch (e) {
            console.error(">> Scheduler.runMissedTasks()", e, e.stack);
        }
    }

    // Schedule the next tick at the next minute boundary
    _scheduleNextTick() {
        const now = Temporal.Now.zonedDateTimeISO(this.timezone);
        const nextMinute = now
            .with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })
            .add({ minutes: 1 });
        const delay = nextMinute.toInstant().epochMilliseconds - now.toInstant().epochMilliseconds;
        setTimeout(() => this._tick(), delay);
    }

    // Tick: run due tasks, then schedule next
    async _tick() {
        try {
            // console.log("-- Scheduler.tick()", new Date().toISOString());
            const olap   = this.getOlap();
            const nowISO = Temporal.Now.instant().toString();
            const res    = await olap.query(
                `SELECT * FROM schedules WHERE next_run <= ? AND (type <> 'repeating' OR executed = FALSE)`,
                [nowISO]
            );
            const rows   = res.rows;
            for (const row of rows) {
                await this._runJob(row, { isMissed: false });
            }
        } catch (e) {
            console.error(">> Scheduler.tick()", e, e.stack);
        }
        this._scheduleNextTick();
    }

    // admin
    async dropAll() {
        const olap = this.getOlap();
        await olap.query('DELETE FROM schedules');
    }

    async purge() {
        const olap = this.getOlap();
        await olap.query('DELETE FROM schedules WHERE type <> \'repeating\' AND executed = true');
    }

    // Fluent API entrypoints
    every() {
        return new RepeatingBuilder(this);
    }

    next() {
        return new NextBuilder(this);
    }

    retry() {
        return new RetryBuilder(this);
    }

    // Internal: execute job and update DB
    async _runJob(row, { isMissed }) {
        const executed = row[13];
        const type = row[2];

        // Skip if already executed for one-off or retry completed
        if (executed && type !== 'repeating') return;

        const scheduleid = row[0];      // scheduleid
        const function_id = row[3];
        const spayload = row[6];
        const expression = row[4];
        const retry_plan = row[8];
        const lastRunISO = Temporal.Now.instant().toString();
        let retriesLeft = row[7] ?? 0;   // retries_left
        let nextRunISO = null;
        let executedFlag = false;
        let succeeded = false;
        let errorMessage = null;

        // Lookup function
        const fn = this.registry.get(function_id);
        if (!fn) {
            errorMessage = `Function with id '${function_id}' not found`;
            console.error(">> Scheduler.tick():", errorMessage);
        } else {
            try {
                const payload = JSON.parse(spayload);
                // Call function with payload; expect Promise<boolean>
                const result = await fn(payload);
                if (result !== false) {
                    succeeded = true;
                    console.log(`-- Scheduler: Task ${scheduleid} (${function_id}) executed successfully`);
                } else {
                    console.log(`-- Scheduler: Task ${scheduleid} (${function_id}) returned false`);
                    errorMessage = 'Task returned false';
                }
            } catch (err) {
                console.error(`>> Scheduler: Task ${scheduleid} (${function_id}) threw an error:`, err, err.stack);
                errorMessage = err.message;
            }
        }

        // Determine next run and executed flag based on type and success
        if (type === 'repeating') {
            // Always schedule next, regardless of success or missing function
            try {
                const interval = cronParser.CronExpressionParser.parse(expression, { currentDate: new Date()/*, tz: cronTZ*/ });
                const nextDateJS = interval.next().toDate();
                const nextInstant = Temporal.Instant.fromEpochMilliseconds(nextDateJS.getTime());
                nextRunISO = nextInstant.toString();
            } catch (err) {
                console.error(`Error parsing cron for task ${scheduleid}:`, err, err.stack);
                errorMessage = err.message;
            }
        } else if (type === 'next') {
            // One-off: mark executed regardless of success or failure
            executedFlag = true;
        } else if (type === 'retry') {
            const plan = JSON.parse(retry_plan);
            if (succeeded || !fn) {
                // On success or missing function, do not schedule further retries
                executedFlag = true;
            } else {
                // On failure, schedule next retry if available
                const idx = plan.length - retries_left;
                if (idx + 1 < plan.length) {
                    const durationSeconds = plan[idx + 1];
                    const nextInstant = Temporal.Now.instant().add({ seconds: durationSeconds });
                    nextRunISO = nextInstant.toString();
                    retriesLeft = retries_left - 1;
                } else {
                    // No retries left: mark executed
                    executedFlag = true;
                }
            }
        }
        const olap = this.getOlap();

        // Update the DB (including last_error)
        await olap.query(
            `UPDATE schedules
         SET next_run = ?,
             last_run = ?,
             last_error = ?,
             executed = ?,
             retries_left = ?,
             updated_at = ?,
       WHERE scheduleid = ?`,
            [nextRunISO, lastRunISO, errorMessage, executedFlag ? 1 : 0, retriesLeft, new Date().toISOString(), scheduleid]
        );
    }
}

// RepeatingBuilder: support cron or Temporal intervals (e.g., every day at 09:00)
class RepeatingBuilder {
    constructor(scheduler) {
        this.scheduler = scheduler;
        this._cron = null;
        this._name = universe.random(9);
        this._temporalExpr = null;
        this._functionId = null;
        this._payload = {};
    }

    name(name) {
        this._name = name;
        return this;
    }

    function(id) {
        this._functionId = id;
        return this;
    }

    cron(expr) {
        this._cron = expr;
        return this;
    }

    // Temporal expression: pass a function that returns next ZonedDateTime
    temporal(fnNextZDT) {
        this._temporalExpr = fnNextZDT;
        return this;
    }

    payload(obj) {
        this._payload = obj;
        return this;
    }

    async schedule() {
        if (!this._functionId) throw new Error('Scheduler: Function ID must be specified');

        let nextRunISO;
        if (this._cron) {
            const interval = cronParser.CronExpressionParser.parse(this._cron, { currentDate: new Date()/*, tz: cronTZ*/ });
            const nextDateJS = interval.next().toDate();
            nextRunISO = Temporal.Instant.fromEpochMilliseconds(nextDateJS.getTime()).toString();
        } else if (this._temporalExpr) {
            const nextZDT = this._temporalExpr(Temporal.Now.instant());
            nextRunISO = nextZDT.toInstant().toString();
        } else {
            throw new Error('Either cron or temporal expression must be defined');
        }
        const olap = this.scheduler.getOlap();
        const res = await olap.query(
            `INSERT INTO schedules (name, type, function_id, expression, next_run, payload) VALUES(?, ?, ?, ?, ?, ?); SELECT currval('scheduleid') AS currval`,
            [
                this._name,
                'repeating',
                this._functionId,
                this._cron || JSON.stringify({ temporal: true }),
                nextRunISO,
                JSON.stringify(this._payload)
            ]
        );
        const id = res?.rows?.[0][0];
        return id;
    }
}

// NextBuilder: one-off schedule, either from now or specific date/time
class NextBuilder {
    constructor(scheduler) {
        this.scheduler = scheduler;
        this._name = null;
        this._instant = null;
        this._functionId = null;
        this._payload = {};
    }

    function(id) {
        this._functionId = id;
        return this;
    }

    name(name) {
        this._name = name;
        return this;
    }

    // Use a Temporal.Duration-like object from now, e.g. { days: 1, hours: 2 }
    fromNow(durationObj) {
        const ztd = Temporal.Now.zonedDateTimeISO(this.timezone).with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        const now = ztd.toInstant();
        const instant = now.add(durationObj);
        this._instant = instant;
        return this;
    }

    // Use a specific date/time string or Temporal.PlainDateTime/PlainInstant
    at(datetime) {
        if (typeof datetime === 'string') {
            this._instant = Temporal.Instant.from(datetime);
        } else if (typeof datetime === "number") {
            this._instant = Temporal.Instant.from(new Date(datetime).toISOString());
            this._instant = Temporal.Instant.from(new Date(datetime).toISOString());
        } else if (datetime instanceof Date) {
            this._instant = Temporal.Instant.from(datetime.toISOString());
        } else if (datetime instanceof Temporal.PlainDateTime) {
            this._instant = datetime.toZonedDateTimeISO(this.scheduler.timezone).toInstant();
        } else if (datetime instanceof Temporal.Instant) {
            this._instant = datetime;
        } else if (datetime instanceof Temporal.ZonedDateTime) {
            this._instant = datetime.toInstant();
        } else {
            throw new Error('Unsupported datetime type');
        }
        return this;
    }

    payload(obj) {
        this._payload = obj;
        return this;
    }

    async schedule() {
        if (!this._functionId) throw new Error('Function ID must be specified');
        if (!this._instant) throw new Error('A date/time must be specified');
        const olap = this.scheduler.getOlap();
        const instantISO = this._instant.toString();
        const res = await olap.query(
            `INSERT INTO schedules (name, type, function_id, expression, next_run, payload, executed) VALUES(?, ?, ?, ?, ?, ?, 0); SELECT currval('scheduleid') AS currval`,
            [
                this._name,
                'next',
                this._functionId,
                JSON.stringify({ at: instantISO }),
                instantISO,
                JSON.stringify(this._payload)
            ]
        );
        const id = res?.rows?.[0][0];
        return id;
    }
}

// RetryBuilder: multiple intervals from now
class RetryBuilder {
    constructor(scheduler) {
        this.scheduler = scheduler;
        this._retries = [];
        this._functionId = null;
        this._name = null;
        this._payload = {};
    }

    function(id) {
        this._functionId = id;
        return this;
    }

    name(name) {
        this._name = name;
        return this;
    }

    // intervals in seconds, first element defines initial offset
    intervals(...secs) {
        this._retries = secs;
        return this;
    }

    payload(obj) {
        this._payload = obj;
        return this;
    }

    async schedule() {
        if (!this._functionId) throw new Error('Function ID must be specified');
        if (this._retries.length === 0) throw new Error('At least one interval is required');
        const firstInstant = Temporal.Now.instant().add({ seconds: this._retries[0] });
        const olap = this.scheduler.getOlap();
        const instantISO = firstInstant.toString();
        const res = await olap.query(
            `INSERT INTO schedules (name, type, function_id, expression, next_run, payload, retries_left, retry_plan) VALUES(?, ?, ?, ?, ?, ?, ?, ?); SELECT currval('scheduleid') AS currval`,
            [
                this._name,
                'retry',
                this._functionId,
                JSON.stringify({}),
                instantISO,
                JSON.stringify(this._payload),
                this._retries.length,
                JSON.stringify(this._retries)
            ]
        );
        const id = res?.rows?.[0][0];
        return id;
    }
}

// Export a single Scheduler instance
const scheduler = new Scheduler();
export default scheduler;

// Example usage (e.g. in index.js or app.js):
// ------------------------------------------------
// import scheduler from './scheduler.js';
// import { Temporal } from '@js-temporal/polyfill';

// // Define some task functions:
// const sayHello = async ({ name }) => {
//   console.log(`Hello, ${name}!`);
//   return true; // indicates success
// };
//
// const unreliableTask = async ({ attempt }) => {
//   console.log(`Running unreliableTask, attempt ${attempt}`);
//   const success = Math.random() > 0.5;
//   if (success) {
//     console.log('Unreliable task succeeded');
//     return true;
//   } else {
//     console.log('Unreliable task failed');
//     return false;
//   }
// };
//
// (async () => {
//   // Register functions with IDs
//   scheduler.register('sayHello', sayHello);
//   scheduler.register('unreliable', unreliableTask);
//
//   // Run missed tasks first
//   await scheduler.runMissedTasks();
//
//   // Start scheduler loop
//   await scheduler.init();
//
//   // 1) Repeating: every Monday at 09:00 UTC using cron, pass payload
//   scheduler.every()
//     .function('sayHello')
//     .cron('0 9 * * 1')
//     .payload({ name: 'Alice' })
//     .schedule();
//
//   // 2) One-off: in 30 minutes, call sayHello
//   scheduler.next()
//     .function('sayHello')
//     .fromNow({ minutes: 30 })
//     .payload({ name: 'Bob' })
//     .schedule();
//
//   // 3) Retry: unreliableTask at 10s, 60s, and 300s intervals with payload
//   scheduler.retry()
//     .function('unreliable')
//     .intervals(10, 60, 300)
//     .payload({ attempt: 1 })
//     .schedule();
// })();

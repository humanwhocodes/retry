/**
 * @fileoverview A utility for retrying failed async method calls.
 */

/* global setTimeout, clearTimeout */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import createDebug from "debug";

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

const MAX_TASK_TIMEOUT = 60000;
const MAX_TASK_DELAY = 100;
const MAX_CONCURRENCY = 1000;

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const debug = createDebug("retrier");

/*
 * The following logic has been extracted from graceful-fs.
 *
 * The ISC License
 *
 * Copyright (c) 2011-2023 Isaac Z. Schlueter, Ben Noordhuis, and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Checks if it is time to retry a task based on the timestamp and last attempt time.
 * @param {RetryTask} task The task to check.
 * @param {number} maxDelay The maximum delay for the queue.
 * @returns {boolean} true if it is time to retry, false otherwise.
 */
function isTimeToRetry(task, maxDelay) {
    const timeSinceLastAttempt = Date.now() - task.lastAttempt;
    const timeSinceStart = Math.max(task.lastAttempt - task.timestamp, 1);
    const desiredDelay = Math.min(timeSinceStart * 1.2, maxDelay);

    return timeSinceLastAttempt >= desiredDelay;
}

/**
 * Checks if it is time to bail out based on the given timestamp.
 * @param {RetryTask} task The task to check.
 * @param {number} timeout The timeout for the queue.
 * @returns {boolean} true if it is time to bail, false otherwise.
 */
function isTimeToBail(task, timeout) {
    return task.age > timeout;
}

/**
 * Creates a new promise with resolve and reject functions.
 * @returns {{promise:Promise<any>, resolve:(value:any) => any, reject: (value:any) => any}} A new promise.
 */
function createPromise() {
    if (Promise.withResolvers) {
        return Promise.withResolvers();
    }

    let resolve, reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    if (resolve === undefined || reject === undefined) {
        throw new Error("Promise executor did not initialize resolve or reject.");
    }

    return { promise, resolve, reject };
}


/**
 * A class to represent a task in the retry queue.
 */
class RetryTask {

    /**
     * The unique ID for the task.
     * @type {string}
     */
    id = Math.random().toString(36).slice(2);

    /**
     * The function to call.
     * @type {Function}
     */
    fn;

    /**
     * The error that was thrown.
     * @type {Error}
     */
    error;
    
    /**
     * The timestamp of the task.
     * @type {number}
     */
    timestamp = Date.now();

    /**
     * The timestamp of the last attempt.
     * @type {number}
     */
    lastAttempt = this.timestamp;

    /**
     * The resolve function for the promise.
     * @type {Function}
     */
    resolve;

    /**
     * The reject function for the promise.
     * @type {Function}
     */
    reject;

    /**
     * The AbortSignal to monitor for cancellation.
     * @type {AbortSignal|undefined}
     */
    signal;

    /**
     * Creates a new instance.
     * @param {Function} fn The function to call.
     * @param {Error} error The error that was thrown.
     * @param {Function} resolve The resolve function for the promise.
     * @param {Function} reject The reject function for the promise.
     * @param {AbortSignal|undefined} signal The AbortSignal to monitor for cancellation.
     */
    constructor(fn, error, resolve, reject, signal) {
        this.fn = fn;
        this.error = error;
        this.timestamp = Date.now();
        this.lastAttempt = Date.now();
        this.resolve = resolve;
        this.reject = reject;
        this.signal = signal;
    }
    
    /**
     * Gets the age of the task.
     * @returns {number} The age of the task in milliseconds.
     * @readonly
     */
    get age() {
        return Date.now() - this.timestamp;
    }
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A class that manages a queue of retry jobs.
 */
export class Retrier {

    /**
     * Represents the queue for processing tasks.
     * @type {Array<RetryTask>}
     */
    #retrying = [];

    /**
     * Represents the queue for pending tasks.
     * @type {Array<Function>}
     */
    #pending = [];

    /**
     * The number of tasks currently being processed.
     * @type {number}
     */
    #working = 0;

    /**
     * The timeout for the queue.
     * @type {number}
     */
    #timeout;

    /**
     * The maximum delay for the queue.
     * @type {number}
     */
    #maxDelay;

    /**
     * The setTimeout() timer ID.
     * @type {NodeJS.Timeout|undefined}
     */
    #timerId;

    /**
     * The function to call.
     * @type {Function}
     */
    #check;

    /**
     * The maximum number of concurrent tasks.
     * @type {number}
     */
    #concurrency;

    /**
     * Creates a new instance.
     * @param {Function} check The function to call.
     * @param {object} [options] The options for the instance.
     * @param {number} [options.timeout] The timeout for the queue.
     * @param {number} [options.maxDelay] The maximum delay for the queue.
     * @param {number} [options.concurrency] The maximum number of concurrent tasks.
     */
    constructor(check, { timeout = MAX_TASK_TIMEOUT, maxDelay = MAX_TASK_DELAY, concurrency = MAX_CONCURRENCY } = {}) {

        if (typeof check !== "function") {
            throw new Error("Missing function to check errors");
        }

        this.#check = check;
        this.#timeout = timeout;
        this.#maxDelay = maxDelay;
        this.#concurrency = concurrency;
    }

    /**
     * Gets the number of tasks waiting to be retried.
     * @returns {number} The number of tasks in the retry queue.
     * @readonly
     */
    get retrying() {
        return this.#retrying.length;
    }

    /**
     * Gets the number of tasks waiting to be processed in the pending queue.
     * @returns {number} The number of tasks in the pending queue.
     * @readonly
     */
    get pending() {
        return this.#pending.length;
    }

    /**
     * Gets the number of tasks currently being processed.
     * @returns {number} The number of tasks currently being processed.
     * @readonly
     */
    get working() {
        return this.#working;
    }

    /**
     * Calls the function and retries if it fails.
     * @param {Function} fn The function to call.
     * @param {Object} options The options for the job.
     * @param {AbortSignal} [options.signal] The AbortSignal to monitor for cancellation.
     * @param {Promise<any>} options.promise The promise to return when the function settles.
     * @param {Function} options.resolve The resolve function for the promise.
     * @param {Function} options.reject The reject function for the promise.
     * @returns {Promise<any>} A promise that resolves when the function is
     * called successfully.
     */
    #call(fn, { signal, promise, resolve, reject }) {

        let result;

        try {
            result = fn();
        } catch (/** @type {any} */ error) {
            reject(new Error(`Synchronous error: ${error.message}`, { cause: error }));
            return promise;
        }

        // if the result is not a promise then reject an error
        if (!result || typeof result.then !== "function") {
            reject(new Error("Result is not a promise."));
            return promise;
        }

        this.#working++;

        // call the original function and catch any ENFILE or EMFILE errors
        // @ts-ignore because we know it's any
        return Promise.resolve(result)
            .then(value => {
                debug("Function called successfully without retry.");
                this.#working--;
                this.#processPending();
                resolve(value);
                return promise;
            })
            .catch(error => {
                if (!this.#check(error)) {
                    this.#working--;
                    reject(error);
                    return promise;
                }

                const task = new RetryTask(fn, error, resolve, reject, signal);
                
                debug(`Function failed, queuing for retry with task ${task.id}.`);
                this.#retrying.push(task);

                signal?.addEventListener("abort", () => {
                    debug(`Task ${task.id} was aborted due to AbortSignal.`);
                    reject(signal.reason);
                });

                this.#processQueue();

                return promise;
            });
    }

    /**
     * Adds a new retry job to the queue.
     * @param {Function} fn The function to call.
     * @param {object} [options] The options for the job.
     * @param {AbortSignal} [options.signal] The AbortSignal to monitor for cancellation.
     * @returns {Promise<any>} A promise that resolves when the queue is
     *  processed.
     */
    retry(fn, { signal } = {}) {

        signal?.throwIfAborted();

        const { promise, resolve, reject } = createPromise();

        this.#pending.push(() => this.#call(fn, { signal, promise, resolve, reject }));
        this.#processPending();
        
        return promise;
    }

    /**
     * Processes the pending queue to see which tasks can be started.
     * @returns {void}
     */
    #processPending() {

        debug(`Processing pending tasks: ${this.pending} pending, ${this.working} working.`);
        while (this.pending > 0 && this.working < this.#concurrency) {
            const task = this.#pending.shift();
            task?.();
        }

        debug(`Processed pending tasks: ${this.pending} pending, ${this.working} working.`);
    }

    /**
     * Processes the queue.
     * @returns {void}
     */
    #processQueue() {
        // clear any timer because we're going to check right now
        clearTimeout(this.#timerId);
        this.#timerId = undefined;

        debug(`Processing retry queue: ${this.retrying} retrying, ${this.working} working.`);

        const processAgain = () => {
            this.#timerId = setTimeout(() => {
                this.#processPending();
                this.#processQueue();
            }, 0);
        };

        // if there's nothing in the queue, we're done
        const task = this.#retrying.shift();
        if (!task) {
            debug("Queue is empty, exiting.");

            if (this.pending) {
                processAgain();
            }
            return;
        }

        // if it's time to bail, then bail
        if (isTimeToBail(task, this.#timeout)) {
            this.#working--;
            debug(`Task ${task.id} was abandoned due to timeout.`);
            task.reject(task.error);
            processAgain();
            return;
        }

        // if it's not time to retry, then wait and try again
        if (!isTimeToRetry(task, this.#maxDelay)) {
            debug(`Task ${task.id} is not ready to retry, skipping.`);
            this.#retrying.push(task);
            processAgain();
            return;
        }

        // otherwise, try again
        task.lastAttempt = Date.now();
        
        // Promise.resolve needed in case it's a thenable but not a Promise
        Promise.resolve(task.fn())
            // @ts-ignore because we know it's any
            .then(result => {
                this.#working--;
                debug(`Task ${task.id} succeeded after ${task.age}ms.`);
                task.resolve(result);
            })

            // @ts-ignore because we know it's any
            .catch(error => {
                if (!this.#check(error)) {
                    this.#working--;
                    debug(`Task ${task.id} failed with non-retryable error: ${error.message}.`);
                    task.reject(error);
                    return;
                }

                // update the task timestamp and push to back of queue to try again
                task.lastAttempt = Date.now();
                this.#retrying.push(task);
                debug(`Task ${task.id} failed, requeueing to try again.`);
            })
            .finally(() => {
                this.#processPending();
                this.#processQueue();
            });
    }
}

/**
 * @fileoverview Tests for the Retrier class.
 */
/*global describe, it, AbortSignal, AbortController, setTimeout */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { Retrier } from "../src/retrier.js";
import assert from "node:assert";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("Retrier", () => {

    describe("new Retrier()", () => {

        it("should throw an error when a function isn't passed", () => {
            assert.throws(() => {
                // @ts-expect-error
                new Retrier();
            }, /Missing function/);
        });

    });

    describe("retry()", () => {
        
        it("should retry a function that rejects an error", async () => {

            let count = 0;
            const retrier = new Retrier(error => error.message === "foo");
            const result = await retrier.retry(async () => {
                count++;

                if (count === 1) {
                    throw new Error("foo");
                }

                return count;
            });

            assert.equal(result, 2);
        });

        it("should retry a function that rejects an error using a non-Promise thenable", async () => {

            let count = 0;
            const retrier = new Retrier(error => error.message === "foo");
            const result = await retrier.retry(() => {
                count++;

                if (count === 1) {
                    return {
                        then() {
                            throw new Error("foo");
                        }
                    };
                }

                return {
                    then(fn) {
                        fn(count);
                    }
                };
            });

            assert.equal(result, 2);
        });

        it("should retry a function that rejects an error multiple times", async () => {

            let count = 0;
            const retrier = new Retrier(error => error.message === "foo");
            const result = await retrier.retry(async () => {
                count++;

                if (count < 5) {
                    throw new Error("foo");
                }

                return count;
            });

            assert.equal(result, 5);
        });

        it("should reject an error when the function is synchronous", () => {

            const retrier = new Retrier(error => error.message === "foo");

            return assert.rejects(() => {
                return retrier.retry(() => {
                    throw new Error("foo");
                });
            }, {
                message: "Synchronous error: foo"
            });
        });

        it("should reject an error that Retrier isn't expecting after expected errors", () => {

            const retrier = new Retrier(error => error.message === "foo");
            let callCount = 0;

            return assert.rejects(async () => {
                await retrier.retry(async () => {
                    callCount++;

                    if (callCount < 3) {
                        throw new Error("foo");
                    }

                    throw new Error("bar");
                });
            }, /bar/);
        });

        it("should reject an error when the function doesn't return a promise", () => {

            const retrier = new Retrier(error => error.message === "foo");

            return assert.rejects(async () => {
                // @ts-expect-error
                await retrier.retry(() => {});
            }, /Result is not a promise/);
        });

        it("should cancel a function when an AbortSignal starts out aborted", async () => {

            let count = 0;
            const retrier = new Retrier(error => error.message === "foo");
            await assert.rejects(async () => {
                await retrier.retry(async () => {
                    count++;

                    if (count < 5) {
                        throw new Error("foo");
                    }

                    return count;
                }, { signal: AbortSignal.abort()});
            }, /AbortError/);
        });

        it("should cancel a function when an AbortSignal times out", async () => {

            let count = 0;
            const retrier = new Retrier(error => error.message === "foo");
            await assert.rejects(async () => {
                await retrier.retry(async () => {
                    count++;

                    if (count < 5) {
                        throw new Error("foo");
                    }

                    return count;
                }, { signal: AbortSignal.timeout(100)});
            }, /TimeoutError/);
        });

        it("should cancel a function when an AbortSignal is triggered", async () => {

            let count = 0;
            const controller = new AbortController();
            const retrier = new Retrier(error => error.message === "foo");

            setTimeout(() => {
                controller.abort();
            }, 100);

            await assert.rejects(async () => {
                await retrier.retry(async () => {
                    count++;

                    if (count < 5) {
                        throw new Error("foo");
                    }

                    return count;
                }, { signal: controller.signal });
            }, /AbortError/);
        });

    });

});

/**
 * @fileoverview Tests for the Retrier class.
 */
/* global beforeEach, afterEach, describe, it, AbortSignal, AbortController, setTimeout */

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

        let caughtUnhandledRejection;

        function unhandledRejectionListener(err) {
            caughtUnhandledRejection = err;
        }

        beforeEach(() => {
            process.addListener("unhandledRejection", unhandledRejectionListener);
            caughtUnhandledRejection = null;
        });

        afterEach(() => {
            process.removeListener("unhandledRejection", unhandledRejectionListener);

            // Ensure that no unhandled promise rejection has occurred.
            assert.ifError(caughtUnhandledRejection);
        });
        
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

        describe("Concurrency", () => {


            it("should retry a function that rejects an error with default concurrency", async () => {

                let count1 = 0;
                let count2 = 0;
                const retrier = new Retrier(error => error.message === "foo");
                const promise1 = retrier.retry(async () => {
                    count1++;

                    if (count1 === 1) {
                        throw new Error("foo");
                    }

                    return count1;
                });

                const promise2 = retrier.retry(async () => {
                    count2++;

                    if (count2 < 3) {
                        throw new Error("foo");
                    }

                    return count2;
                });

                const promise3 = retrier.retry(async () => {
                    return 42;
                });


                assert.strictEqual(retrier.working, 3);
                assert.strictEqual(retrier.pending, 0);

                const result1 = await promise1;
                const result2 = await promise2;
                const result3 = await promise3;

                assert.strictEqual(retrier.working, 0);
                assert.strictEqual(retrier.pending, 0);

                assert.strictEqual(result1, 2);
                assert.strictEqual(result2, 3);
                assert.strictEqual(result3, 42);
            });

            it("should retry a function that rejects an error with concurrency: 1", async () => {

                let count1 = 0;
                let count2 = 0;
                const retrier = new Retrier(error => error.message === "foo", {
                    concurrency: 1
                });
                const promise1 = retrier.retry(async () => {
                    count1++;

                    if (count1 === 1) {
                        throw new Error("foo");
                    }

                    return count1;
                });

                const promise2 = retrier.retry(async () => {
                    count2++;

                    if (count2 < 3) {
                        throw new Error("foo");
                    }

                    return count2;
                });

                const promise3 = retrier.retry(async () => {
                    return 42;
                });

                
                assert.strictEqual(retrier.working, 1);
                assert.strictEqual(retrier.pending, 2);

                const result1 = await promise1;
                const result2 = await promise2;
                const result3 = await promise3;

                assert.strictEqual(retrier.working, 0);
                assert.strictEqual(retrier.pending, 0);

                assert.strictEqual(result1, 2);
                assert.strictEqual(result2, 3);
                assert.strictEqual(result3, 42);
            });

            it("should retry 100 functions that reject an error with concurrency", async () => {
                    
                let count = 0;
                const retrier = new Retrier(error => error.message === "foo", {
                    concurrency: 10
                });

                const values = Array.from({ length: 100 }, (_, i) => i);
                const promises = [];
                for (const value of values) {
                    promises.push(retrier.retry(async () => {
                        count++;

                        if (count < value) {
                            throw new Error("foo");
                        }

                        return count;
                    }));
                }

                assert.strictEqual(retrier.working, 10);
                assert.strictEqual(retrier.pending, 90);

                const results = await Promise.all(promises);
                assert.strictEqual(retrier.working, 0);
                assert.strictEqual(retrier.pending, 0);

                for (let i = 0; i < 100; i++) {
                    assert.strictEqual(results[i], i + 1);
                }
            });

            it("should retry 100 functions that that don't reject an error with concurrency", async () => {
                    
                const retrier = new Retrier(error => error.message === "foo", {
                    concurrency: 5
                });

                const values = Array.from({ length: 10000 }, (_, i) => i);
                const promises = [];
                for (const value of values) {
                    promises.push(retrier.retry(async () => value));
                }

                assert.strictEqual(retrier.working, 5);
                assert.strictEqual(retrier.pending, 9995);
                assert.strictEqual(retrier.retrying, 0);
                
                const results = await Promise.all(promises);
                assert.strictEqual(retrier.working, 0);
                assert.strictEqual(retrier.pending, 0);
                assert.strictEqual(retrier.retrying, 0);

                for (let i = 0; i < 100; i++) {
                    assert.strictEqual(results[i], i);
                }
            });

            it("should retry a function until it throws an unknown error", async () => {

                let count1 = 0;
                let count2 = 0;
                const retrier = new Retrier(error => error.message === "foo");
                const promise1 = retrier.retry(async () => {
                    count1++;

                    if (count1 === 1) {
                        throw new Error("foo");
                    }

                    return count1;
                });

                const promise2 = retrier.retry(async () => {
                    count2++;

                    if (count2 < 3) {
                        throw new Error("foo");
                    }

                    return count2;
                });

                const promise3 = retrier.retry(async () => {
                    throw new TypeError("Whatever");
                });


                assert.strictEqual(retrier.working, 3);
                assert.strictEqual(retrier.pending, 0);

                const result1 = await promise1;
                const result2 = await promise2;
                await assert.rejects(promise3, /Whatever/);

                assert.strictEqual(result1, 2);
                assert.strictEqual(result2, 3);
            });
        });

        describe("Errors", () => {
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
                    await retrier.retry(() => { });
                }, /Result is not a promise/);
            });
        });

        describe("AbortSignal", () => {

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
                    }, { signal: AbortSignal.abort() });
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
                    }, { signal: AbortSignal.timeout(0) });
                }, /TimeoutError/);
            });

            it("should cancel a function when an AbortSignal is triggered", async () => {

                let count = 0;
                const controller = new AbortController();
                const retrier = new Retrier(error => error.message === "foo", {
                    maxDelay: 500
                });

                setTimeout(() => {
                    controller.abort();
                }, 0);

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

});

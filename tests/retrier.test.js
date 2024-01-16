/**
 * @fileoverview Tests for the Retrier class.
 */
/*global describe, it, beforeEach, afterEach*/

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { Retrier } from "../src/retrier.js";
import { assert } from "chai";

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

});

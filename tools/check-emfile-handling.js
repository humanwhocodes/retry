/**
 * @fileoverview A utility to test that ESLint doesn't crash with EMFILE/ENFILE errors.
 * @author Nicholas C. Zakas
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import fs from "node:fs";
import { readFile } from "node:fs/promises";
import { Retrier } from "../src/retrier.js";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const OUTPUT_DIRECTORY = "tmp/emfile-check";
const FILE_COUNT = 15000;

/**
 * Generates files in a directory.
 * @returns {void}
 */
function generateFiles() {

    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

    for (let i = 0; i < FILE_COUNT; i++) {
        const fileName = `file_${i}.js`;
        const fileContent = `// This is file ${i}`;

        fs.writeFileSync(`${OUTPUT_DIRECTORY}/${fileName}`, fileContent);
    }

}

/**
 * Generates an EMFILE error by reading all files in the output directory.
 * @returns {Promise<Buffer[]>} A promise that resolves with the contents of all files.
 */
function generateEmFileError() {
    return Promise.all(
        Array.from({ length: FILE_COUNT }, (_, i) => {
            const fileName = `file_${i}.js`;

            return readFile(`${OUTPUT_DIRECTORY}/${fileName}`);
        })
    );
}

/**
 * Generates an EMFILE error by reading all files in the output directory with retries.
 * @returns {Promise<Buffer[]>} A promise that resolves with the contents of all files.
 */ 
function generateEmFileErrorWithRetry() {
    const retrier = new Retrier(error => error.code === "EMFILE" || error.code === "ENFILE");

    return Promise.all(
        Array.from({ length: FILE_COUNT }, (_, i) => {
            const fileName = `file_${i}.js`;

            return retrier.retry(() => readFile(`${OUTPUT_DIRECTORY}/${fileName}`));
        })
    );    
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

console.log(`Generating ${FILE_COUNT} files in ${OUTPUT_DIRECTORY}...`);
generateFiles();

console.log("Checking that this number of files would cause an EMFILE error...");
generateEmFileError()
    .then(() => {
        throw new Error("EMFILE error not encountered.");
    })
    .catch(error => {
        if (error.code === "EMFILE") {
            console.log("✅ EMFILE error encountered:", error.message);
        } else if (error.code === "ENFILE") {
            console.log("✅ ENFILE error encountered:", error.message);
        } else {
            console.error("❌ Unexpected error encountered:", error.message);
            throw error;
        }
    }).then(() => {

        console.log("Running with retry...");
        return generateEmFileErrorWithRetry()
            .then(() => {
                console.log("✅ No errors encountered with retry.");
            })
            .catch(error => {
                console.error("❌ Unexpected error encountered with retry:", error.message);
                throw error;
            });

    });

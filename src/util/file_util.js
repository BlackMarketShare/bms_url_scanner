const fs = require('fs');

/**
 * Clears the contents of the specified file.
 * @param {string} filePath - Path to the file to be cleared.
 */
function clearFileContents(filePath) {
    fs.writeFile(filePath, '', (err) => {
        if (err) throw err;
    });
}


/**
 * Appends content to the specified file.
 * @param {string} filePath - Path to the file where content will be appended.
 * @param {string} content - Content to append to the file.
 */
function appendToFile(filePath, content) {
    if (content.trim() == '') {
        return;
    }
    fs.appendFile(filePath, content+'\n', (err) => {
        if (err) throw err;
    });
}

// Export the functions
module.exports = {
    clearFileContents,
    appendToFile
};
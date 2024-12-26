const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

// Input and Output Directories
const inputDir = path.resolve(__dirname, "input");
const outputDir = path.resolve(__dirname, "output");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to get terminal width for the progress bar
function getTerminalWidth() {
  return process.stdout.columns || 80;
}

/**
 * Display a full-width progress bar in the terminal.
 * @param {string} fileName - Name of the file being processed.
 * @param {number} progress - Progress percentage (0 to 100).
 */
function updateProgressBar(fileName, progress) {
  const totalWidth = getTerminalWidth();
  const label = `${fileName}:`;
  const percentage = `${progress.toFixed(1)}%`;
  const availableWidth = totalWidth - label.length - percentage.length - 5; // Buffer for spaces
  const barWidth = Math.max(availableWidth, 10);
  const completedWidth = Math.round((progress / 100) * barWidth);
  const bar = `[${"#".repeat(completedWidth)}${"-".repeat(
    barWidth - completedWidth
  )}]`;
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${label} ${bar} ${percentage}`);
}

/**
 * Optimize a GIF file using gifsicle.
 * @param {string} inputPath - Path to the input GIF file.
 * @param {string} outputPath - Path to the output optimized GIF file.
 * @param {string} fileName - Name of the file being processed.
 * @returns {Promise<void>} - A Promise that resolves when optimization is complete.
 */
function optimizeGIF(inputPath, outputPath, fileName) {
  return new Promise((resolve, reject) => {
    const process = spawn("gifsicle", [
      "--optimize=3",
      "--lossy=80",
      "--colors=128",
      "-o",
      outputPath,
      inputPath,
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      updateProgressBar(fileName, Math.min(progress, 100));
    }, 200);

    process.on("close", (code) => {
      clearInterval(interval);
      if (code === 0) {
        updateProgressBar(fileName, 100); // Ensure progress bar completes
        console.log(); // Move to the next line
        resolve();
      } else {
        reject(
          new Error(
            `Optimization failed for ${fileName} with exit code ${code}`
          )
        );
      }
    });

    process.on("error", (err) => {
      clearInterval(interval);
      reject(err);
    });
  });
}

/**
 * Process all .gif files in the input directory.
 */
async function processGIFs() {
  const files = fs.readdirSync(inputDir);
  const gifFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".gif"
  );
  const totalFiles = gifFiles.length;

  if (totalFiles === 0) {
    console.log("No .gif files found in the input directory.");
    return;
  }

  console.log(`Found ${totalFiles} GIF file(s). Starting optimization...\n`);

  for (const file of gifFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    try {
      await optimizeGIF(inputPath, outputPath, file);
    } catch (error) {
      console.error(`\nFailed to optimize file: ${file}`);
    }
  }

  console.log("\nAll files optimized successfully!");
}

// Ensure gifsicle is installed
const checkGifsicle = spawn("gifsicle", ["--version"]);
checkGifsicle.on("error", () => {
  console.error(
    "gifsicle is not installed. Please install gifsicle and try again."
  );
});
checkGifsicle.on("close", (code) => {
  if (code === 0) {
    processGIFs();
  }
});

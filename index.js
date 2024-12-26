import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import readline from "readline";
import pLimit from "p-limit"; // Using ESM import

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and Output Directories
const inputDir = path.resolve(__dirname, "input");
const outputDir = path.resolve(__dirname, "output");

// Check if the input directory exists
if (!fs.existsSync(inputDir)) {
  console.error(
    `🔴 Error: The input directory "${inputDir}" does not exist. \n`
  );
  process.exit(1); // Exit the process with a non-zero status
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to get terminal width for the progress bar
function getTerminalWidth() {
  return process.stdout.columns || 80;
}

// Function to format file size in KB, MB, or GB
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

/**
 * Display a full-width progress bar in the terminal.
 * @param {string} fileName - Name of the file being processed.
 * @param {number} progress - Progress percentage (0 to 100).
 * @param {number} originalSize - Original file size in bytes.
 * @param {number} optimizedSize - Optimized file size in bytes.
 */
function updateProgressBar(fileName, progress, originalSize, optimizedSize) {
  const totalWidth = getTerminalWidth();
  const label = `${fileName}:`;
  const percentage = `${progress.toFixed(1)}%`;
  const sizeInfo = `(${formatFileSize(originalSize)} -> ${formatFileSize(
    optimizedSize
  )})`;
  const availableWidth =
    totalWidth - label.length - percentage.length - sizeInfo.length - 10; // Buffer for spaces
  const barWidth = Math.max(availableWidth, 10);
  const completedWidth = Math.round((progress / 100) * barWidth);
  const bar = `[${"#".repeat(completedWidth)}${"-".repeat(
    barWidth - completedWidth
  )}]`;
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${label} ${bar} ${percentage} ${sizeInfo}`);
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
    const originalSize = fs.statSync(inputPath).size;
    const process = spawn("gifsicle", [
      "--optimize=3",
      "--lossy=40", // Reduce lossy compression
      "--colors=140",
      "-o",
      outputPath,
      inputPath,
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      const optimizedSize = fs.existsSync(outputPath)
        ? fs.statSync(outputPath).size
        : originalSize;
      updateProgressBar(
        fileName,
        Math.min(progress, 100),
        originalSize,
        optimizedSize
      );
    }, 200);

    process.on("close", (code) => {
      clearInterval(interval);
      const optimizedSize = fs.existsSync(outputPath)
        ? fs.statSync(outputPath).size
        : originalSize;

      // Check if optimization resulted in a larger file
      if (optimizedSize >= originalSize) {
        console.log(
          `\n❌ ${fileName}: Skipping optimization as it results in a larger file.`
        );
        fs.copyFileSync(inputPath, outputPath); // Copy original file if larger
        resolve();
      } else {
        updateProgressBar(fileName, 100, originalSize, optimizedSize); // Ensure progress bar completes
        console.log(); // Move to the next line
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `\n🔴 Optimization failed for ${fileName} with exit code ${code} \n`
            )
          );
        }
      }
    });

    process.on("error", (err) => {
      clearInterval(interval);
      reject(err);
    });
  });
}

/**
 * Process all .gif files in the input directory with parallelism.
 */
async function processGIFs() {
  const files = fs.readdirSync(inputDir);
  const gifFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".gif"
  );
  const totalFiles = gifFiles.length;

  if (totalFiles === 0) {
    console.log("🪣 No .gif files found in the input directory. \n");
    return;
  }

  console.log(`Found ${totalFiles} GIF file(s). Starting optimization...\n`);

  // Create a limit to control the number of concurrent promises
  const limit = pLimit(4); // Limit to 4concurrent optimizations, adjust based on your system

  // Process files in parallel with a limit on concurrency
  const promises = gifFiles.map((file) => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    return limit(() => optimizeGIF(inputPath, outputPath, file));
  });

  try {
    await Promise.all(promises);
    console.log("\n✅✅✅ All files optimized successfully! ✅✅✅ \n");
  } catch (error) {
    console.error("\n🔴 Error during optimization:", error);
  }
}

// Ensure gifsicle is installed
const checkGifsicle = spawn("gifsicle", ["--version"]);
checkGifsicle.on("error", () => {
  console.error(
    "🔴 gifsicle is not installed. Please install gifsicle and try again."
  );
});
checkGifsicle.on("close", (code) => {
  if (code === 0) {
    processGIFs();
  }
});

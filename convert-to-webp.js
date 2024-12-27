import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import sharp from "sharp";
import pLimit from "p-limit"; // Concurrency control

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and Output Directories
const inputDir = path.resolve(__dirname, "images");
const outputDir = path.resolve(__dirname, "webp-images");

// Check if the input directory exists
if (!fs.existsSync(inputDir)) {
  console.error(`🔴 Error: The images directory "${inputDir}" does not exist.`);
  process.exit(1);
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
 * @param {number} convertedSize - Converted file size in bytes.
 */
function updateProgressBar(fileName, progress, originalSize, convertedSize) {
  const totalWidth = getTerminalWidth();
  const label = `${fileName}:`;
  const percentage = `${progress.toFixed(1)}%`;
  const sizeInfo = `(${formatFileSize(originalSize)} -> ${formatFileSize(
    convertedSize
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
 * Convert an image to WebP format.
 * @param {string} inputPath - Path to the input image file.
 * @param {string} outputPath - Path to the output WebP file.
 * @param {string} fileName - Name of the file being processed.
 * @returns {Promise<void>} - A Promise that resolves when conversion is complete.
 */
async function convertToWebP(inputPath, outputPath, fileName) {
  const originalSize = fs.statSync(inputPath).size;
  let progress = 0;

  // Simulate progress for the conversion process
  const interval = setInterval(() => {
    progress += Math.random() * 10; // Increment progress randomly
    const convertedSize = fs.existsSync(outputPath)
      ? fs.statSync(outputPath).size
      : originalSize;
    updateProgressBar(
      fileName,
      Math.min(progress, 100),
      originalSize,
      convertedSize
    );
  }, 200);

  try {
    await sharp(inputPath).webp().toFile(outputPath);
    clearInterval(interval);
    const convertedSize = fs.statSync(outputPath).size;
    updateProgressBar(fileName, 100, originalSize, convertedSize);
    console.log(); // Move to the next line
  } catch (err) {
    clearInterval(interval);
    console.error(`\n🔴 Error converting ${fileName}: ${err.message}`);
  }
}

/**
 * Process all JPG/PNG files in the input directory with parallelism.
 */
async function processImages() {
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png)$/i.test(path.extname(file))
  );
  const totalFiles = imageFiles.length;

  if (totalFiles === 0) {
    console.log("🪣 No JPG or PNG files found in the input directory.");
    return;
  }

  console.log(`Found ${totalFiles} image file(s). Starting conversion...\n`);

  // Create a limit to control the number of concurrent promises
  const limit = pLimit(4); // Limit to 4 concurrent conversions, adjust as needed

  // Process files in parallel with a limit on concurrency
  const promises = imageFiles.map((file) => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(
      outputDir,
      path.basename(file, path.extname(file)) + ".webp"
    );
    return limit(() => convertToWebP(inputPath, outputPath, file));
  });

  try {
    await Promise.all(promises);
    console.log("\n✅✅✅ All files converted successfully! ✅✅✅\n");
  } catch (error) {
    console.error("\n🔴 Error during conversion:", error.message);
  }
}

// Start processing images
processImages();

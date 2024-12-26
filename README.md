# Giftimize

This is a GIF Optimizer Node.js script that optimizes .gif files in a specified input directory and saves the optimized files to an output directory. It uses gifsicle for the optimization process, reducing file sizes while maintaining quality.

## Features

- **Batch Optimization**: Process multiple .gif files in one go.
- **Dynamic Progress Bar**: Displays a real-time progress bar for each file being optimized.
- **Cross-Platform**: Works on Windows, macOS, and Linux.
- **Customizable Directories**: Easily configure the input and output directories.

## Requirements

- **Node.js** (LTS version recommended)
- **gifsicle** (must be installed separately)

## Installation

### Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org).

### Install gifsicle

#### macOS

```bash
brew install gifsicle
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install gifsicle -y
```

#### Windows

1. Download gifsicle from [Eternally Bored](http://eternallybored.org/misc/gifsicle/).
2. Extract the downloaded file.
3. Add the extracted folder to your system's PATH environment variable.

**Test installation:**

```bash
gifsicle --version
```

### Clone or Download the Repository

Clone this repository or download the script to your local machine.

### Install Dependencies

Run the following command in the directory containing the script:

```bash
npm install
```

## Usage

### Prepare Directories

Create an `input/` directory and place your .gif files inside it.

The script will create an `output/` directory if it doesn’t already exist.

### Run the Script

Run the script using the following command:

```bash
npm start
```

### Progress and Output

The terminal will display real-time progress bars for each file being optimized. Optimized files will be saved in the `output/` directory with the same file names as the originals.

## Configuration

The script uses the following default directories:

- **Input Directory**: `input/`
- **Output Directory**: `output/`

You can modify these directories in the script by changing the `inputDir` and `outputDir` variables:

```js
const inputDir = path.resolve(__dirname, "input");
const outputDir = path.resolve(__dirname, "output");
```

## Troubleshooting

### gifsicle is not installed

Ensure gifsicle is installed and accessible via your system’s PATH. Run:

```bash
gifsicle --version
```

If the command fails, follow the installation instructions above.

### No .gif files found

Ensure that the `input/` directory contains .gif files before running the script.

## License

This script is open-source and available under the MIT License.

Happy optimizing! 🚀

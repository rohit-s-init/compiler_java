# LISA Compiler Toolchain

## Overview

The LISA Compiler Toolchain is a custom-built compilation pipeline designed for the LISA Instruction Set Architecture (ISA). It provides an end-to-end workflow starting from parsing a high-level `.lisa` program to generating assembly code and executable machine code in HEX format.

The system is composed of:
- A Java-based frontend for lexical and syntax analysis
- A Node.js-based backend for code generation and assembly generation
- A custom assembler that produces HEX output compatible with the LISA processor

---

## Features

- Parsing of custom `.lisa` programs
- Generation of structured parse trees
- Conversion to LISA assembly instructions
- Translation to HEX machine code
- Command-line interface for streamlined usage
- Output compatible with the LISA processor and emulator

---

## Prerequisites

- Java JDK (version 8 or above)
- Node.js (version 14 or above)
- Terminal or Command Prompt
- Visual Studio Code or any code editor (recommended)

---

## Installation and Setup

### 1. Clone the Repository

git clone https://github.com/rohit-s-init/compiler_java.git
cd compiler_java

### 2. Configure the CLI Command

Copy the full path to the folder containing lisa.bat.

Press Win + S, search for "Edit the system environment variables", and open it.

Click Environment Variables > Find Path under System Variables > Click Edit.

Click New and paste your folder path.

Click OK on all windows and restart your terminal.


Ensure that the `lisa.bat` file (or equivalent script) is added to your system's environment variables (PATH).

Example:
C:\lisa\

After adding it to PATH:
- Restart your terminal
- Verify installation: enter command : where lisa
- If error showing, restart the system

lisa

---

## How to Use

### 1. Create a Source File

- Open Visual Studio Code (or any editor)
- Create a file with the `.lisa` extension

Example:
program.lisa

enter code inside the file:
Example:

int main(){
    while(1){
        printStr("HEllo World");
    }    
}

---

### 2. Generate Parse Tree

Run the following command:

lisa parse <file_path>

Example:

lisa parse E:\compiler\program.lisa

This step performs lexical and syntax analysis using the Java frontend and generates the parse structure.

---

### 3. Compile to Assembly and HEX

Run the following command:

lisa compile <file_path>

Example:

lisa compile E:\compiler\program.lisa

This step:
- Generates LISA assembly code (`.lasm`)
- Generates machine code in HEX format (`.hex`)

Both files are saved in the same directory as the input file.

---

### 4. Run on LISA Processor

- The generated `.hex` file can be directly loaded into the LISA processor or emulator
- The `.lasm` file can be used for debugging and inspection

---

## Output

For an input file:

program.lisa

Generated files:

- program.lasm — Assembly code  
- program.hex — Machine code (HEX format)

---

## Compatibility

The generated outputs are fully compatible with the LISA processor architecture.

---

## Compilation Flow

.lisa → lisa parse → lisa compile → .lasm + .hex → LISA Processor

---

## Architecture

| Component     | Technology |
|---------------|-----------|
| Frontend      | Java      |
| Backend       | Node.js   |
| Assembly      | Custom ISA |
| Machine Code  | HEX Format |
| Execution     | LISA Processor / Emulator |

---

## Notes

- `lisa parse` uses the Java-based frontend
- `lisa compile` uses the Node.js backend and assembler
- The CLI unifies all compilation stages under a single command

---

## Author

Rohit Sawant

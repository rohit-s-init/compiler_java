const fs = require("node:fs/promises");
const path = require("node:path");

const { tokenize } = require("./LexicalAnalysis");
const Parser = require("./parser").default;
const { AnnubisBackend } = require("./AnnubisBackend");
const asmtobin = require("./asmtobin").default;

async function run() {
    const args = process.argv;

    // Expect: node cli.js <file_path>
    if (args.length < 3) {
        console.log("Usage: node cli.js <file_path>");
        return;
    }

    const filePath = path.resolve(args[2]);

    try {
        // 📂 Read input file
        const data = await fs.readFile(filePath, "utf8");

        // 🔍 Parse
        const parser = new Parser(tokenize(data));
        const parseTree = parser.parseProgram();

        // ⚙️ Backend → Assembly
        const backend = new AnnubisBackend(parseTree.body);
        backend.genAssembly();
        const assembly = backend.instructions;

        // 🔢 Convert → HEX
        const hex = asmtobin(assembly).join("\n");

        // 📍 Output paths (same folder)
        const dir = path.dirname(filePath);
        const baseName = path.basename(filePath, path.extname(filePath));

        const asmPath = path.join(dir, `${baseName}.lasm`);
        const hexPath = path.join(dir, `${baseName}.hex`);

        // 💾 Save files
        await fs.writeFile(asmPath, assembly.join("\n"));
        await fs.writeFile(hexPath, "v2.0 raw\n" + hex);

        console.log("✅ Compilation Successful!");
        console.log("Assembly:", asmPath);
        console.log("HEX:", hexPath);

    } catch (error) {
        console.error("❌ Error:", error.message || error);
    }
}

run();
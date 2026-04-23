import fs from "fs/promises"
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile } from 'fs/promises'; // Fixes the .then() issue too
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const TERMINALS = [
    "int", "short", "long", "char",
    "if", "else", "while", "return", "new",

    "IDENTIFIER", "NUMBER", "STRING", "CHARACTER",

    "=", "+", "-", "*", "/", "%",
    "==", "!=",
    ">", "<", ">=", "<=",
    "&&", "||",
    "<<", ">>",

    "(", ")", "{", "}", "[", "]", ",",

    "$"
];

const NON_TERMINALS = [
    "PROGRAM",
    "STATEMENT",
    "DATA_TYPE",
    "TYPE_TAIL",
    "DECL_TAIL",
    "ID_TAIL",
    "ARR_TAIL",

    "PARAM_LIST",
    "PARAM_LIST_TAIL",
    "PARAM",
    "ARG_LIST",
    "ARG_LIST_TAIL",
    "PARAM_LIST_OPT",
    "ARG_LIST_OPT",

    "BLOCK",
    "STATEMENT_LIST",

    "IF_STATEMENT",
    "IF_TAIL",
    "IF_TAIL2",

    "WHILE_LOOP",
    "RETURN_STMT",

    "EXPRESSION",
    "LOGICAL",
    "LOGICAL_TAIL",
    "EQUALITY",
    "EQUALITY_TAIL",
    "COMPARISON",
    "COMPARISON_TAIL",
    "SHIFT",
    "SHIFT_TAIL",
    "ADD",
    "ADD_TAIL",
    "MUL",
    "MUL_TAIL",
    "MOD",
    "MOD_TAIL",

    "PRIMARY",
    "PRIMARY_TAIL"
];

const PROGRAMM = {
    "PROGRAM": [
        ["STATEMENT", "PROGRAM"],
        ["ε"]
    ],

    "STATEMENT": [
        ["DATA_TYPE", "TYPE_TAIL"],
        ["IDENTIFIER", "ID_TAIL"],
        ["IF_STATEMENT"],
        ["WHILE_LOOP"],
        ["RETURN_STMT"],
        ["BLOCK"]
    ],

    "DATA_TYPE": [
        ["int"],
        ["short"],
        ["long"],
        ["char"]
    ],

    "TYPE_TAIL": [
        ["IDENTIFIER", "DECL_TAIL"],
        ["[", "]", "IDENTIFIER", "=", "new", "DATA_TYPE", "[", "EXPRESSION", "]"]
    ],

    "DECL_TAIL": [
        ["=", "EXPRESSION"],
        ["(", "PARAM_LIST_OPT", ")", "BLOCK"]
    ],

    "ID_TAIL": [
        ["=", "EXPRESSION"],
        ["(", "ARG_LIST_OPT", ")"],
        ["[", "EXPRESSION", "]", "ARR_TAIL"]
    ],

    "ARR_TAIL": [
        ["=", "EXPRESSION"],
        ["ε"]
    ],

    "PARAM_LIST": [
        ["PARAM", "PARAM_LIST_TAIL"]
    ],

    "PARAM_LIST_TAIL": [
        [",", "PARAM", "PARAM_LIST_TAIL"],
        ["ε"]
    ],

    "PARAM": [
        ["DATA_TYPE", "IDENTIFIER"]
    ],

    "ARG_LIST": [
        ["EXPRESSION", "ARG_LIST_TAIL"]
    ],

    "ARG_LIST_TAIL": [
        [",", "EXPRESSION", "ARG_LIST_TAIL"],
        ["ε"]
    ],

    "PARAM_LIST_OPT": [
        ["PARAM_LIST"],
        ["ε"]
    ],

    "ARG_LIST_OPT": [
        ["ARG_LIST"],
        ["ε"]
    ],

    "BLOCK": [
        ["{", "STATEMENT_LIST", "}"]
    ],

    "STATEMENT_LIST": [
        ["STATEMENT", "STATEMENT_LIST"],
        ["ε"]
    ],

    "IF_STATEMENT": [
        ["if", "(", "EXPRESSION", ")", "BLOCK", "IF_TAIL"]
    ],

    "IF_TAIL": [
        ["else", "IF_TAIL2"],
        ["ε"]
    ],

    "IF_TAIL2": [
        ["if", "(", "EXPRESSION", ")", "BLOCK", "IF_TAIL"],
        ["BLOCK"]
    ],

    "WHILE_LOOP": [
        ["while", "(", "EXPRESSION", ")", "BLOCK"]
    ],

    "RETURN_STMT": [
        ["return", "EXPRESSION"]
    ],

    "EXPRESSION": [
        ["LOGICAL"]
    ],

    "LOGICAL": [
        ["EQUALITY", "LOGICAL_TAIL"]
    ],

    "LOGICAL_TAIL": [
        ["&&", "EQUALITY", "LOGICAL_TAIL"],
        ["||", "EQUALITY", "LOGICAL_TAIL"],
        ["ε"]
    ],

    "EQUALITY": [
        ["COMPARISON", "EQUALITY_TAIL"]
    ],

    "EQUALITY_TAIL": [
        ["==", "COMPARISON", "EQUALITY_TAIL"],
        ["!=", "COMPARISON", "EQUALITY_TAIL"],
        ["ε"]
    ],

    "COMPARISON": [
        ["SHIFT", "COMPARISON_TAIL"]
    ],

    "COMPARISON_TAIL": [
        [">", "SHIFT", "COMPARISON_TAIL"],
        ["<", "SHIFT", "COMPARISON_TAIL"],
        [">=", "SHIFT", "COMPARISON_TAIL"],
        ["<=", "SHIFT", "COMPARISON_TAIL"],
        ["ε"]
    ],

    "SHIFT": [
        ["ADD", "SHIFT_TAIL"]
    ],

    "SHIFT_TAIL": [
        ["<<", "ADD", "SHIFT_TAIL"],
        [">>", "ADD", "SHIFT_TAIL"],
        ["ε"]
    ],

    "ADD": [
        ["MUL", "ADD_TAIL"]
    ],

    "ADD_TAIL": [
        ["+", "MUL", "ADD_TAIL"],
        ["-", "MUL", "ADD_TAIL"],
        ["ε"]
    ],

    "MUL": [
        ["MOD", "MUL_TAIL"]
    ],

    "MUL_TAIL": [
        ["*", "MOD", "MUL_TAIL"],
        ["/", "MOD", "MUL_TAIL"],
        ["ε"]
    ],

    "MOD": [
        ["PRIMARY", "MOD_TAIL"]
    ],

    "MOD_TAIL": [
        ["%", "PRIMARY", "MOD_TAIL"],
        ["ε"]
    ],

    "PRIMARY": [
        ["IDENTIFIER", "PRIMARY_TAIL"],
        ["NUMBER"],
        ["(", "EXPRESSION", ")"],
        ["STRING"],
        ["CHARACTER"]
    ],

    "PRIMARY_TAIL": [
        ["(", "ARG_LIST_OPT", ")"],
        ["[", "EXPRESSION", "]"],
        ["ε"]
    ]
}

const FIRST = {};
const FOLLOW = {};

// Initialize
NON_TERMINALS.forEach(nt => {
    FIRST[nt] = new Set();
    FOLLOW[nt] = new Set();
});










// FIRST store

// Initialize FIRST for non-terminals
NON_TERMINALS.forEach(nt => {
    FIRST[nt] = new Set();
});

// ----------------------
// Compute FIRST
// ----------------------

function computeFirst(symbol) {

    // Terminal → FIRST = itself
    if (TERMINALS.includes(symbol)) {
        return new Set([symbol]);
    }

    // If already computed
    if (FIRST[symbol].size > 0) {
        return FIRST[symbol];
    }

    let result = new Set();

    for (let production of PROGRAMM[symbol]) {

        // ε production
        if (production[0] === "ε") {
            result.add("ε");
            continue;
        }

        for (let sym of production) {

            let firstSet = computeFirst(sym);

            // Add FIRST(sym) - ε
            firstSet.forEach(val => {
                if (val !== "ε") result.add(val);
            });

            // Stop if ε not present
            if (!firstSet.has("ε")) break;

            // If last symbol → add ε
            if (sym === production[production.length - 1]) {
                result.add("ε");
            }
        }
    }

    FIRST[symbol] = result;
    return result;
}

// ----------------------
// Get FIRST of ALL symbols (array output)
// ----------------------

function getAllFirst() {

    let result = {};

    // Non-terminals
    NON_TERMINALS.forEach(nt => {
        result[nt] = [...computeFirst(nt)];
    });

    // Terminals
    TERMINALS.forEach(t => {
        result[t] = [t];
    });

    return result;
}

// ----------------------
// Usage
// ----------------------

const firstTable = getAllFirst();
console.log(firstTable);













// FOLLOW store
// Initialize FOLLOW
NON_TERMINALS.forEach(nt => {
    FOLLOW[nt] = new Set();
});

// ----------------------
// FIRST of string (needed)
// ----------------------

function computeFirstOfString(symbols) {
    let result = new Set();

    for (let sym of symbols) {

        let firstSet;

        if (TERMINALS.includes(sym)) {
            firstSet = new Set([sym]);
        } else {
            firstSet = computeFirst(sym);
        }

        firstSet.forEach(val => {
            if (val !== "ε") result.add(val);
        });

        if (!firstSet.has("ε")) return result;
    }

    result.add("ε");
    return result;
}

// ----------------------
// Compute FOLLOW
// ----------------------

function computeFollow() {

    // Rule 1: Start symbol
    FOLLOW["PROGRAM"].add("$");

    let changed = true;

    while (changed) {
        changed = false;

        for (let A in PROGRAMM) {

            for (let production of PROGRAMM[A]) {

                for (let i = 0; i < production.length; i++) {

                    let B = production[i];

                    // Only for non-terminals
                    if (!NON_TERMINALS.includes(B)) continue;

                    let before = FOLLOW[B].size;

                    let beta = production.slice(i + 1);

                    if (beta.length > 0) {

                        let firstBeta = computeFirstOfString(beta);

                        // Rule 2: FIRST(β) - ε
                        firstBeta.forEach(val => {
                            if (val !== "ε") FOLLOW[B].add(val);
                        });

                        // Rule 3: if ε in FIRST(β)
                        if (firstBeta.has("ε")) {
                            FOLLOW[A].forEach(val => FOLLOW[B].add(val));
                        }

                    } else {
                        // Rule 3: B at end
                        FOLLOW[A].forEach(val => FOLLOW[B].add(val));
                    }

                    if (FOLLOW[B].size > before) {
                        changed = true;
                    }
                }
            }
        }
    }
}

// ----------------------
// Get FOLLOW (array output)
// ----------------------

function getAllFollow() {

    computeFollow();

    let result = {};

    NON_TERMINALS.forEach(nt => {
        result[nt] = [...FOLLOW[nt]];
    });

    return result;
}

// ----------------------
// Usage
// ----------------------

const followTable = getAllFollow();
console.log(followTable);


let excelData = [];

let map = [];


function getFirsts(prg) {
    let res = [];
    for (let i = 0; i < prg.length; i++) {
        let frst = firstTable[prg[i]];


        if (!frst) {
            frst = [prg[i]];
        }

        res = [...res, ...frst];

        if (!frst.includes("ε")) {
            break;
        }

    }
    return res;

}

NON_TERMINALS.forEach(nt => {
    PROGRAMM[nt].forEach((prg) => {

        const resp = getFirsts(prg);
        let values = [];

        if (!resp) {
            values = [...followTable[nt]];
        } else {
            values = [...resp];
        }

        values.forEach((val) => {
            if (!map[nt]) {
                map[nt] = [];
            }
            if (map[nt][val]) {
                console.log("nt : " + nt + " val : " + val)
                console.log("prev : " + map[nt][val]);
                console.log("neu : " + prg.join(" "));
                throw "error found"
            }
            map[nt][val] = prg.join(" ");
        })

    });
});




import ExcelJS from 'exceljs'
import path from "path";

async function createExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Sheet');

    // Define Columns
    sheet.columns = [{ header: "name", key: "name", width: 32 }, ...TERMINALS.map(val => {
        return { header: val, key: val, width: 32 }
    })]


    let str = `
import java.util.HashMap;

class ParserTable{
    private java.util.HashMap<String,java.util.HashMap<String,String>> map;

    public ParserTable(){
    `;

    Object.keys(map).forEach(key => {
        let row = {};

        str += `java.util.HashMap<String, String> ${key} = new HashMap<String,String>();`

        Object.keys(map[key]).forEach(val => {
            row["name"] = key;
            row[val] = map[key][val];

            str += `${key}.put("${val}", "${map[key][val]}");\n`;

        })

        str += `map.put("${key}", ${key});\n`
        sheet.addRow(row);

    })

    str += `

    }

    public String get(String nonTerminal,String Terminal){
        return map.get(Terminal).get(nonTerminal);
    }

}    
`
    fs.writeFile(path.join(__dirname, "../parser/ParserTable.java"), str).then((resp) => { }).catch(e => console.log(e));
    console.log(str);


    // Write to File
    await workbook.xlsx.writeFile('map3.xlsx');
    console.log('File created successfully!');




}

createExcel();



console.log("printing")


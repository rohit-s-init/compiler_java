export default function asmtobin(code) {
    const OPCODES = {
        'ADD': '1',           // Add(r1,r2,r3)
        'SUB': '10',          // sub(r1,r2,r3)
        'MUL': '11',
        'DIV': '100',
        'MOD': '101',
        'LSHIFT': '10110',
        'RSHIFT': '10111',
        'LOG_AND': '110110',
        'LOG_OR': '110111',
        'EQL': '111000',
        'NOT_EQL': '111001',
        'GRTR': '111010',
        'LESS': '111011',
        'GRTR_EQL': '111100',
        'LESS_EQL': '111101',
        'MOD': '111110',

        'ADDI': '110',        // add(r1,d)
        'SUBI': '111',
        'MULI': '1000',
        'DIVI': '1001',
        'MODI': '1010',
        'LOAD': '1011',       // load(r1,d)  //test-F

        'LOADC': '1100',      // load comp(r1,r2)
        'LOADCI': '1101',     // load comp(r1,d)

        'IF_GRTR': '1110',
        'IF_LESS': '1111',
        'IF_EQL': '10000',
        'JMP': '11010',

        'READ_EVENT': '10001',
        'USER_INP': '10010',

        "PRINT_D": "10011",
        "PRINT_R": "10100",
        "CLS": "10101",

        "DIGITAL_WD_HIGH": "11000",
        "DIGITAL_WD_LOW": "11000",
        "DIGITAL_WR": "11001",

        "MOVE": "11110",

        "WRITE_INT_D": "11100", //remained to check
        "WRITE_INT_R": "11101", //remained to check

        "SET_RTN_ADD": "11111",//can remove this ,not needed yet, utlise oppcode somewhere we have rtn now

        "PUSH_STACK_D": "100000",
        "POP_STACK": "100001",
        "PUSH_STACK_R": "100010",
        "UPDATE_STACK_D": "100011",
        "UPDATE_STACK_R": "100100",
        "INC_STACK_D": "100101",
        "INC_STACK_R": "100110",//can also remove this if more oppcode needed as such not needed
        "DEC_STACK_D": "100111",
        "DEC_STACK_R": "101000",//can also remove this if more oppcode needed as such not needed
        "READ_STACK": "101001",
        "CALL": "101010",
        "COPY": "101101",
        "STORE": "101110",
        "RTN": "110001",
        "LIA": "110010",

        "UPD_BP_REG": "110100",

        "UPD_HP_REG": "110101"


    };



    let function_offset = 0;
    let isFuncActive = 0;
    let funcsAdd = [];
    let funcBaseAdd = 0;

    function padLeft(s, len) { return s.padStart(len, '0'); }
    function toBin(n, bits) {
        if (n < 0) {
            n = Math.pow(2, bits) + n;
        }
        return n.toString(2).padStart(bits, '0').slice(-bits);
    }
    function parseNumberTok(tok) {
        tok = tok.trim();
        if (tok.toUpperCase() == "TEMP_DATA") return 0x00000003;
        if (tok.toUpperCase() == "BP") return 0x00000007;
        if (tok.toUpperCase() == "SP") return 0x0000000b;
        if (tok.toUpperCase() == "HP") return 0x0000000f;
        if (tok.startsWith('0x') || tok.startsWith('0X')) return parseInt(tok, 16);
        if (tok.startsWith('b') || tok.startsWith('B')) return parseInt(tok.substr(1), 2);
        return parseInt(tok, 10);
    }

    function parseLine(line, lineno) {
        let baseAdds = [0, 0, 0];
        let sphp = [0, 0, 0];
        let clean = line.replace(/;.*$/, '').replace(/\/\/.*$/, '').trim();
        if (!clean) return null;
        clean = clean.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ');
        let [op, rest] = clean.split(/\s+(.+)/);
        if (!op) return null;
        op = op.toUpperCase();
        let bytes = 0;
        if (op.split(":").length == 2) {
            bytes = op.split(":")[1];
            op = op.split(":")[0];

        }
        if (op.split(":").length == 3) {

            baseAdds = op.split(":")[2].split(",").map(val => {
                return ((val == "BP" || val == "HP") ? 1 : 0)
            });
            sphp = op.split(":")[2].split(",").map(val => {
                return ((val == "HP") ? 1 : 0)
            });

            bytes = op.split(":")[1];
            op = op.split(":")[0];

        }
        let args = [];
        if (rest) {
            args = rest.split(',').map(s => s.trim()).filter(Boolean);
            args = args.map(a => a.replace(/^\[|\]$/g, '').trim());
        }





        function getFinalBin() {
            if (op === 'ADD' && args.length === 2 && /\d+/.test(args[1])) { /* maybe immediate? not used */ }

            let opcodeToken = OPCODES[op];
            if (!opcodeToken) {
                if (op === 'ADD' && args.length === 2) { opcodeToken = OPCODES['ADDI']; op = 'ADDI'; }
                else if (op === 'SUB' && args.length === 2) { opcodeToken = OPCODES['SUBI']; op = 'SUBI'; }
                else if (op === 'MUL' && args.length === 2) { opcodeToken = OPCODES['MULI']; op = 'MULI'; }
                else if (op === 'DIV' && args.length === 2) { opcodeToken = OPCODES['DIVI']; op = 'DIVI'; }
                else opcodeToken = OPCODES[op];
            }
            if (!opcodeToken) throw new Error(`Unknown opcode '${op}' on line ${lineno + 1}`);

            let opcode6 = padLeft(opcodeToken, 6);

            const threeRegOps = ['1', '10', '11', '100', '101'];

            if (args.length === 3) {


                let r1 = parseNumberTok(args[0]);
                let r2 = parseNumberTok(args[1]);
                let r3 = parseNumberTok(args[2]);
                if (isNaN(r1) || isNaN(r2) || isNaN(r3)) throw new Error(`Invalid register on line ${lineno + 1}`);
                if (r1 < 0 || r1 > 0xFFFFFFFF || r2 < 0 || r2 > 0xFFFFFFFF || r3 < 0 || r3 > 0xFFFFFFFF) throw new Error(`Registers must be 0..255 on line ${lineno + 1}`);
                const bin = opcode6 + toBin(r1, 16) + toBin(r2, 16) + toBin(r3, 16) + '00000000' + toBin(bytes - 1, 2);
                return bin.toString();
            }

            if (args.length === 2) {

                let r1 = parseNumberTok(args[0]);
                let imm = parseNumberTok(args[1]);
                if (isNaN(r1) || isNaN(imm)) throw new Error(`Invalid operands on line ${lineno + 1}`);

                if (op == "STORE") {
                    const bin = opcode6 + toBin(r1, 16) + "0000000000000000" + toBin(imm, 16) + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "COPY") {
                    const bin = opcode6 + toBin(r1, 16) + toBin(imm, 16) + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "LOADC") {
                    const bin = opcode6 + toBin(r1, 16) + toBin(imm, 16) + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }
                if (op == "MOVE") {
                    const bin = opcode6 + toBin(r1, 16) + toBin(imm, 16) + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                const bin = opcode6 + toBin(r1, 16) + toBin(imm, 32) + '00000000' + toBin(bytes - 1, 2);
                return bin;
            }

            if (args.length === 1) {
                let val = parseNumberTok(args[0]);



                if (op == "UPDATE_STACK_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }








                if (op == "CALL") {
                    const bin = opcode6 + "0000000000000000" + "0000000000000000" + toBin(val, 16) + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "UPD_BP_REG") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "UPD_HP_REG") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "READ_STACK") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "DEC_STACK_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "INC_STACK_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "WRITE_STACK_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "PUSH_STACK_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "SET_RTN_ADD") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "WRITE_INT_D") {
                    const bin = opcode6 + "0000000000000000" + toBin(val, 32) + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "WRITE_INT_R") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "DIGITAL_WD_HIGH") {
                    const bin = opcode6 + "0000000000000000" + toBin(val, 16).split("").map((val, ind) => ind == 8 ? '1' : val).join("") + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "DIGITAL_WD_LOW") {
                    const bin = opcode6 + "0000000000000000" + toBin(val, 32).split("").map((val, ind) => ind == 24 ? '0' : val).join("") + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "DIGITAL_WR") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "SET_COPY_ADD") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op == "MOV_TO_ADD") {
                    const bin = opcode6 + toBin(val, 16) + "0000000000000000" + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin; i
                }

                if (op == "PRINT_D") {
                    const char = (args[0].toString())
                    return opcode6 + "0000000000000000" + toBin(val, 32).slice(-32) + "00000000" + toBin(bytes - 1, 2);
                }

                if (op == "PRINT_R") {
                    const bin = opcode6 + toBin(val, 16) + '0000000000000000' + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op.startsWith('IF_')) {
                    if (val < 0 || val > 0xFFFFFF) throw new Error(`Branch address must fit in 24 bits (0..16777215) on line ${lineno + 1}`);
                    const bin = opcode6 + "0000000000000000" + toBin(val, 32) + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }

                if (op === 'READ_EVENT' || op === 'USER_INP') {
                    const bin = opcode6 + toBin(val, 16) + '0000000000000000' + "0000000000000000" + '00000000' + toBin(bytes - 1, 2);
                    return bin;
                }
                const bin = opcode6 + "0000000000000000" + toBin(val, 32) + '00000000' + toBin(bytes - 1, 2);

                return bin;
            }

            if (args.length === 0) {

                if (op == "RTN") {
                    bytes = 4;
                }

                const bin = opcode6 + '0000000000000000' + '0000000000000000' + "0000000000000000" + '00000000' + '11';
                return bin;
            }

            throw new Error(`Unsupported operand format on line ${lineno + 1}`);
        }


        let finalBin = (getFinalBin());
        let finalAns = getFinalBin()?.toString().split("");
        finalAns[finalAns.length - 8] = sphp[0];
        finalAns[finalAns.length - 7] = sphp[1];
        finalAns[finalAns.length - 6] = sphp[2];
        finalAns[finalAns.length - 5] = baseAdds[0];
        finalAns[finalAns.length - 4] = baseAdds[1];
        finalAns[finalAns.length - 3] = baseAdds[2];

        let finalString = finalAns.join("");


        return finalString

    }

    function groupBinary(b) {
        return b.match(/.{1,4}/g).join(' ');
    }

    function genHexCode(code) {
        let str = "";
        for (let i = 0; i < 16; i++) {
            let hedDig = ((parseInt(code.substring(i * 4, i * 4 + 4), 2).toString(16)));
            str += hedDig;
        }

        return str;
    }

    function binToHexWord(b) {
        if (b.length !== 64) throw new Error('Binary word length != 64');
        let hex = genHexCode(b).toUpperCase();
        return hex.substring(0, 8) + "\n" + hex.substring(8, 16);
    }



    function compile() {
        const src = code;
        let bins = [];
        let hexes = [];
        let funcs = [];
        let funcBin = [];
        let funcHex = [];

        funcBaseAdd = 0;

        src.forEach((ln, i) => {
            const trimmed = ln.trim();
            if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) return;
            let splitOppcode = trimmed.split(" ");
            if (splitOppcode[0].toUpperCase() == "FUNC") {
                funcsAdd.push({
                    name: splitOppcode[1],
                    address: i
                })
                isFuncActive = true;
                return;
            }
            else if (splitOppcode[0].toUpperCase() == "END") {
                isFuncActive = false;
                return;
            }


            if (isFuncActive) { } else {
                funcBaseAdd++;
            }

        })
        src.forEach((ln, i) => {
            const trimmed = ln.trim();
            if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) return;
            let splitOppcode = trimmed.split(" ");
            if (splitOppcode[0].toUpperCase() == "FUNC") {
                funcsAdd.push({
                    name: splitOppcode[1],
                    address: i
                })
                isFuncActive = true;
                return;
            }
            else if (splitOppcode[0].toUpperCase() == "END") {
                isFuncActive = false;
                return;
            }

            const b = parseLine(trimmed, i);




            if (b) {

                if (isFuncActive) {
                    funcs.push(binToHexWord(b));
                    funcBin.push(b);
                    funcHex.push(binToHexWord(b));
                    funcHex.push();
                }
                else {
                    bins.push(b);
                    hexes.push(binToHexWord(b));
                    hexes.push()
                }

            }
        });


        let funcBinOffSet = bins.length;
        for (let i = 0; i < funcBin.length; i++) {
            bins[i + funcBinOffSet] = funcBin[i];
        }


        let funcHexOffSet = hexes.length;
        for (let i = 0; i < funcHex.length; i++) {
            hexes[i + funcHexOffSet] = funcHex[i];
        }

        return hexes;
    }






    return compile();

}


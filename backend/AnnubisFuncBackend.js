class Scope {


    constructor(parent) {
        this.vars = [];
        this.scopes = [];
        this.parent = parent;
        this.index = parent?.scopes.length;
    }

    getDatatypeBytes(dataType) {
        if (dataType == "int") {
            return 4;
        }
        else if (dataType == "short") {
            return 2;
        }
        else if (dataType == "byte") {
            return 1;
        }
    }

    addVars(varName, expression, dtype, address) {

        this.vars.push({
            name: varName,
            expression: expression,
            size: this.getDatatypeBytes(dtype),
            dataType: dtype,
            address: address
        })
    }

    createNewScope() {
        let childScope = new Scope(this);
        this.scopes.push(childScope);
        return childScope;
    }

    findVar(varName) {
        let variable = this.vars.find(val => val.name == varName);
        return variable;
    }

}


export class AnnubisFuncBackend {
    constructor(ast, globalVarTable, globalFuncTable) {
        this.ast = ast;
        this.functionAddress = -1;
        this.pos = 0;
        this.varTable = [];
        this.assignedAdd = 0; // 4 reserved for bp
        this.instructions = [];
        this.operator = "OPERATOR";
        this.constant = "CONSTANTS";
        this.identifier = "IDENTIFIERS";
        this.funcCalling = "function_calling"
        this.globalFuncTable = globalFuncTable;
        this.globalVarTable = globalVarTable;
        this.frameSize = 0;
        this.basePointer = 0;
        this.paramPtr = 36;
        this.totalTempMem = 24;
        this.funcAddress = 0;
        this.t1 = 12;
        this.t2 = 8;
        this.t3 = 4;
        this.pT1 = 24;
        this.pT2 = 16;
        this.pT3 = 20;
        this.parentScope = new Scope(null);
        this.activeScope = this.parentScope;
        this.paramsTable = ast.params.reverse().map((param) => {


            if (param.dataType == "int") {
                this.paramPtr += 4;
            }
            else if (param.dataType == "short") {
                this.paramPtr += 2;
            }
            else if (param.dataType == "byte") {
                this.paramPtr += 1;
            }

            let rtnData = {
                "name": param.name,
                "dataType": param.dataType,
                "type": param.identifier,
                "address": this.paramPtr,
                "size": this.getDatatypeBytes(param.dataType)
            }

            return rtnData;
        })

        this.instructions.push(`PUSH_STACK_R:4 bp;  //function  ${this.ast.funcName} pushing (saving) current bp to stack`)
        this.instructions.push(`INC_STACK_D:1 ${this.totalTempMem} // temp_register_update`)
        this.instructions.push(`READ_STACK:4 bp // read_sp_to_bp read current sp value to bp`)
        this.instructions.push(`UPD_BP_REG:4 bp // upd_bpreg_with_bpmem update bp register with bp memort`)
        this.instructions.push(`increase dtak by frame size`);

        this.callFunction = this.callFunction;

    }
    createScopeVar(varName, expression, dtype, address) {
        this.activeScope.addVars(varName, expression, dtype, address)
    }
    updateFuncAddress(address) {
        this.funcAddress = address;
    }
    peek(i = 0) {
        return this.ast.block.body[this.pos + i];
    }
    consume() {
        this.pos++;
    }
    assignAddress(bytes) { let rtnAddress = this.assignedAdd; this.assignedAdd -= bytes; return rtnAddress }
    pushInst(inst) {
        if (typeof inst == 'object') {
            inst.forEach(element => {
                this.instructions.push(element);
            });
            return;
        }
        this.instructions.push(inst);
    }

    getOppName = function (opp) {
        if (opp == "<<") {
            return "LSHIFT"
        }
        if (opp == ">>") {
            return "RSHIFT"
        }
        if (opp == "&&") {
            return "LOG_AND"
        }
        if (opp == "||") {
            return "LOG_OR"
        }
        if (opp == "==") {
            return "EQL"
        }
        if (opp == "!=") {
            return "NOT_EQL"
        }
        if (opp == ">") {
            return "GRTR"
        }
        if (opp == "<") {
            return "LESS"
        }
        if (opp == ">=") {
            return "GRTR_EQL"
        }
        if (opp == "<=") {
            return "LESS_EQL"
        }
        if (opp == "%") {
            return "MOD"
        }
        if (opp == "+") {
            return "ADD"
        }
        if (opp == "-") {
            return "SUB"
        }
        if (opp == "*") {
            return "MUL"
        }
        if (opp == "/") {
            return "DIV"
        }
    }
    findVar(varName) {
        let ele = undefined;
        let value = null;
        let searchScope = this.activeScope;
        while (!value && searchScope != null) {
            value = searchScope.findVar(varName);
            searchScope = searchScope.parent;
        }
        if (value) {
            ele = { ...value, access: "local" };
        }
        else if (this.paramsTable.find((value) => (value.name == varName))) {
            ele = { ...this.paramsTable.find((value) => (value.name == varName)), access: "param" }
        }
        else if (this.globalVarTable.find((value) => (value.name == varName))) {
            ele = { ...this.globalVarTable.find((value) => (value.name == varName)), access: "global" }
        }
        if (!ele?.name) {
            throw "cannot find the element : " + varName + " function : " + this.ast.name;
        } else {
            return ele;
        }

    }
    getDatatypeBytes(dataType) {
        if (dataType == "int") {
            return 4;
        }
        else if (dataType == "short") {
            return 2;
        }
        else if (dataType == "byte") {
            return 1;
        }
    }
    findFunction(funcName) {
        return this.globalFuncTable.find(val => val.ast.funcName == funcName);
    }

    genAssembly() {
        let assembly = [];


        while (this.peek()) {

            this.pushInst(this.parse_statements());
            this.consume();

        }

        this.pushInst(`UPDATE_STACK_R:4 bp;`)
        this.pushInst(`DEC_STACK_D:4 ${this.totalTempMem}`)
        this.pushInst(`POP_STACK:4 bp;`)
        this.pushInst(`UPD_BP_REG:2 bp;`)
        this.pushInst(`RTN;   // end function ${this.ast.funcName}`)

        this.instructions[4] = `INC_STACK_D:4 ${this.frameSize}`

        return assembly;
    }



    parse_statements(body = this.peek()) {

        if (!body) {
            throw "no body found in the parse_statement function inside the AnnubisFuncBackend";
        }

        if (body.type == "var_declaration") {
            return (this.parse_var_declaration(body));
        }

        if (body.type == "var_assignment") {
            return (this.parse_var_assign(body));
        }

        if (body.type == "rtn_statement") {
            return (this.parseReturnStatement(body));
        }

        if (body.type == "conditional_statements") {
            return (this.parse_conditional(body));
        }

        if (body.type == "expression") {
            return (this.parse_expression(body));
        }

        if (body.type == "aray_declration") {
            return (this.parse_arr_declr(body));
        }

        if (body.type == "array_write") {
            return (this.parse_arr_write(body));
        }

        if (body.type == "while_loop") {
            return (this.parse_while_loop(body))
        }

    }





    getExpressionStack(expression) {

        if (expression.left == null && expression.right == null) {
            return [expression.main];
        }


        let arr = [];
        let printPostorder = (expTree, parentExpTree) => {





            if (!expTree.right && !expTree.left) {
                if (!expTree.main.name) {
                }
                return expTree.main;
            }

            let left = (printPostorder(expTree.left, expTree));
            if (left) {
                arr.push(left);
            }
            let right = (printPostorder(expTree.right, expTree));
            if (right) {
                arr.push(right)
            }
            arr.push(expTree.main)

        }

        printPostorder(expression);

        return arr;


    }

    accessArr(data, t0) {
        const name = data.name;
        const indexExp = data.indexExp;
        const variable = this.findVar(name);
        const varAccess = (this.findVar(variable.name).access == "global" ? "gn" : "bp");


        let inst = [];

        this.solveExpression(indexExp).forEach(val => {
            inst.push(val);
        })

        inst.push(`MULI:4:bp,bp,bp ${this.t1},${variable.size * -1}`);
        inst.push(`LOAD:4:bp,bp,bp ${this.t3},0`)
        inst.push(`COPY:4:bp,bp,bp ${this.t3},${this.t1}`);
        inst.push(`UPD_HP_REG:4:${varAccess},${varAccess},${varAccess} ${variable.address}`);
        inst.push(`STORE:4:bp,hp,bp ${this.t3},${this.t3}`)
        inst.push(`LOAD:4:bp,bp,bp ${t0},0`)
        inst.push(`COPY:${variable.size}:bp,bp,bp ${t0},${this.t3}`);

        return inst;

    }

    solveExpression = (expression, bytes = 4, isSimpleExp = 1, isParamExp = 0) => {

        let stackSize = 0;


        let priority_stack = this.getExpressionStack(expression).reverse();
        let temp_stack = [];
        let main_stack = [];
        let isFirstExec = true;
        let inst = [];

        let t1, t2, t3;
        if (isSimpleExp) {
            t1 = this.t1;
            t2 = this.t2;
            t3 = this.t3;
        }
        else if (isParamExp) {
            t1 = this.pT1;
            t2 = this.pT2;
            t3 = this.pT3;
        }

        let len = priority_stack.length;


        if (len == 1) {

            let a0 = priority_stack[0];
            if (a0.type == "CHARACTER") {
                inst.push(`LOAD:${bytes}:bp,bp,bp ${t1},${a0.name.charCodeAt(1)}`)
            }
            else if (a0.type == this.constant) {
                inst.push(`LOAD:${bytes}:bp,bp,bp ${t1},${a0.name}`)
            }
            else if (a0.type == this.identifier) {
                const loadFrom = this.findVar(a0.name);
                const loadFromPtr = loadFrom.access == 'global' ? 'gn' : 'bp';
                const loadToPtr = 'bp'
                inst.push(`LOAD:${bytes}:bp,bp,bp ${t1},0`)
                inst.push(`COPY:${loadFrom.size}:bp,${loadFromPtr},${loadToPtr} ${t1},${JSON.stringify(loadFrom.address)}`)
            }
            else if (a0.type == this.funcCalling) {
                this.callFunction(a0, t1).forEach(ins => {
                    inst.push(ins);
                })
            }
            else if (a0.type == "arrary_accesing") {
                this.accessArr(a0, t1).forEach(ins => {
                    inst.push(ins);
                })
            }
            return inst;

        }



        let offSet = 0;

        let load = (t0, a0) => {
            if (a0.type == "use_ram") {
                inst.push(`POP_STACK:4:gn,gn,bp ${t0}`)
            }
            if (a0.type == this.constant) {
                inst.push(`LOAD:${bytes}:bp,bp,bp ${t0},${a0.name}`);
            }
            else if (a0.type == this.identifier) {

                const a0_bits = this.findVar(a0.name).size;




                const loadFrom = { ...this.findVar(a0.name), access: this.findVar(a0.name).access == "global" ? 'gn' : 'bp' };
                const loadTo = { name: 't1', address: t0, access: "bp" }
                inst.push(`LOAD:4:bp,bp,bp ${t0},0`)
                inst.push(`COPY:${a0_bits}:gn,${loadFrom.access},${loadTo.access} ${t0},${this.findVar(a0.name).address}`);


            }
            else if (a0.type == "function_calling") {

                const compiliments = (t0 == this.t1 ? [this.t2] : (t0 == this.t2 ? [this.t1] : []));

                compiliments.forEach(val => {
                    inst.push(`PUSH_STACK_R:4:bp,bp,gn ${val}`);
                })

                this.callFunction(a0, t0).forEach(ins => {
                    inst.push(ins);
                })

                compiliments.forEach(val => {
                    inst.push(`POP_STACK:4:gn,gn,bp ${val}`);
                })

            }
            else if (a0.type == "arrary_accesing") {

                const compiliments = (t0 == this.t1 ? [this.t2] : (t0 == this.t2 ? [this.t1] : []));

                compiliments.forEach(val => {
                    inst.push(`PUSH_STACK_R:4:bp,bp,gn ${val}`);
                })

                this.accessArr(a0, t0).forEach(ins => {
                    inst.push(ins);
                })

                compiliments.forEach(val => {
                    inst.push(`POP_STACK:4:gn,gn,bp ${val}`);
                })

            }
        }

        for (let i = 0; i < len; i++) {
            let entry = priority_stack.pop();


            if (entry.type != "OPERATOR") {
                main_stack.push(entry);
                offSet++;
                continue;
            }
            else {
                let opp = entry.name;

                load(t1, main_stack.pop())
                load(t2, main_stack.pop())

                inst.push(`${this.getOppName(opp)}:${bytes}:bp,bp,bp ${t2},${t1},${t1}`)

                main_stack.push({ type: "use_ram" });

                if (i != (len - 1)) {
                    inst.push(`PUSH_STACK_R:4:bp,bp,gn ${t1}`)
                }



            }




        }



        return inst;


    }



    parseReturnStatement(body = this.peek()) {

        let inst = [];

        const bytes = this.getDatatypeBytes(this.ast.rtnType);

        let exp = body.expression;
        (this.solveExpression(exp, bytes)).forEach(exp => {
            inst.push(exp);
        })

        inst.push(`MOVE:4:bp,bp,gn ${36},${this.t1};`);
        inst.push(`jmp_func_end ${this.ast.funcName}`);



        return inst;
    }



    callFunction(a0, t0) {

        let inst = [];
        if (a0.name == "prints") {
            inst.push(`POP_STACK:4 temp_data`);
            inst.push(`PRINT_R:1 temp_data`);
            return inst;
        }
        if (a0.name == "printStr" && (a0.params[0]?.name?.string)) {

            let str = a0.params[0].name.string;

            let prevChar = null;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (prevChar === "\\") {
                    switch (char) {
                        case "n":
                            inst.push(`PRINT_D:1 10`); // newline
                            break;
                        case "t":
                            inst.push(`PRINT_D:1 9`); // tab
                            break;
                        case "r":
                            inst.push(`PRINT_D:1 13`); // carriage return
                            break;
                        case "\\":
                            inst.push(`PRINT_D:1 92`); // backslash
                            break;
                        default:
                            inst.push(`PRINT_D:1 ${char.charCodeAt(0)}`);
                    }
                    prevChar = null;
                    continue;
                }

                if (char === "\\") {
                    prevChar = "\\";
                    continue;
                }

                inst.push(`PRINT_D:1 ${char.charCodeAt(0)}`);
            }


            return inst;
        }
        if (a0.name == "cls") {
            let inst = [];
            inst.push("CLS");
            return inst;
        }
        if (a0.name == "initStr") {
            let str = a0.params[0]?.name?.string.split("").reverse().join("");
            let inst = [
                `LOAD:4:bp,bp,bp 12,${str.length + 1}`,
                `MULI:4:bp,bp,bp 12,4`,
                `ADD:4:gn,bp,gn hp,12,hp`,
                `PUSH_STACK_R:4:gn,gn,gn hp`,
                `UPD_HP_REG:4:gn,gn,gn hp`

            ];


            inst.push(`LOAD:4:bp,bp,bp 4,${str.length + 1}`);
            inst.push(`LOAD:4:bp,bp,bp 12,0`);
            inst.push(`MOVE:4:bp,bp,hp 12,4`);


            str.split("").forEach((ch, i) => {
                inst.push(`LOAD:4:bp,bp,bp 4,${ch.charCodeAt(0)}`);
                inst.push(`LOAD:4:bp,bp,bp 12,${i + 1}`);
                inst.push(`MULI:4:bp,bp,bp 12,-4`);
                inst.push(`MOVE:4:bp,bp,hp 12,4`);
            })
            inst.push(`POP_STACK:4:gn,gn,bp ${t0}`);


            return inst;
        }
        if (a0.name == "push_stack") {
            const variable = this.findVar(a0.params[0].name.main.name)
            const size = a0.params[1].name.main.name;
            const access = variable.access == "local" ? "bp" : "gn";
            inst.push(`PUSH_STACK_R:${size}:${access},${access},gn ${variable.address}`);
            return inst;
        }
        if (a0.name == "user_input") {
            const variable = this.findVar(a0.params[0].name.main.name)
            const size = a0.params[1].name.main.name;
            const access = variable.access == "local" ? "bp" : "gn";
            inst.push(`USER_INP:${size}:gn,gn,${access} ${variable.address}`);
            return inst;
        }
        if (a0.name == "pop_stack") {
            const variable = this.findVar(a0.params[0].name.main.name)
            const size = a0.params[1].name.main.name;
            const access = variable.access == "local" ? "bp" : "gn";
            inst.push(`POP_STACK:${size}:gn,gn,${access} ${variable.address}`);
            return inst;
        }

        if (a0.name == "printascii") {
            inst.push(`PRINT_D:1 48`);
            return inst;
        }
        if (a0.name == "printvar") {
            const variable = this.findVar(a0.params[0].name.main.name)
            const access = variable.access == "local" ? "bp" : "gn";
            inst.push(`PRINT_R:1:${access},${access},${access} ${variable.address}`);
            return inst;
        }
        const func = this.findFunction(a0.name);


        const params = a0.params;
        const funcParam = func.paramsTable;

        if (params.length != funcParam.length) {
            throw `error no of parameters not matching parsed ${params.length} required ${funcParam.length} `
        }

        let paramSize = 0;
        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            const paramType = funcParam[i];

            let execInst = this.solveExpression(param.name, this.getDatatypeBytes(paramType.dataType));

            paramSize += this.getDatatypeBytes(paramType.dataType);

            for (let j = 0; j < execInst.length; j++) {
                inst.push(execInst[j]);
            }
            inst.push(`PUSH_STACK_R:${this.getDatatypeBytes(paramType.dataType)}:bp,bp,gn ${this.t1}`)
        }

        inst.push(`LOAD:4:bp,bp,bp ${t0},0`)
        inst.push(`COPY:4:gn,gn,bp ${t0},bp`)
        inst.push(`ADDI:4:bp,bp,bp ${t0},${t0}`)
        inst.push(`PUSH_STACK_R:4:bp,bp,gn ${t0}`)
        inst.push(`CALL ${func.ast.funcName}`);

        inst.push(`DEC_STACK_D:1 ${paramSize + 4}`);




        return inst;

    }

    parse_expression(body = this.peek()) {
        let inst = [];

        (this.solveExpression(body.expression)).forEach(exp => {
            inst.push(exp);
        })

        return inst;
    }

    parse_arr_write(body = this.peek()) {

        let inst = [];


        const variable = this.findVar(body.name);
        const index = body.index;
        const val = body.val;
        const bytes = variable.size;
        const varAccess = (this.findVar(variable.name).access == "global" ? "gn" : "bp");

        this.solveExpression(val).forEach(ins => {
            inst.push(ins);
        })

        inst.push(`LOAD:4:bp,bp,bp ${this.t3},0`)
        inst.push(`COPY:4:bp,bp,bp ${this.t3},${this.t1}`)

        this.solveExpression(index).forEach(ins => {
            inst.push(ins);
        })

        inst.push(`MULI:4:bp,bp,bp ${this.t1},${bytes * -1}`);

        inst.push(`UPD_HP_REG:4:${varAccess},${varAccess},${varAccess} ${variable.address}`);

        inst.push(`MOVE:${bytes}:bp,bp,hp ${this.t1},${this.t3}`)

        return inst;

    }

    parse_arr_declr(body = this.peek()) {
        let inst = [];

        const dType = body.dataType;
        const bytes = 4;

        this.frameSize += bytes;
        this.createScopeVar(body.name, {}, dType, this.assignAddress(bytes))

        const variable = this.findVar(body.name);

        this.solveExpression(body.eleSize).forEach(ins => {
            inst.push(ins);
        })

        inst.push(`MULI:4:bp,bp,bp ${this.t1},${this.getDatatypeBytes(dType)}`);
        inst.push(`ADD:4:gn,bp,gn hp,${this.t1},hp`)

        inst.push(`COPY:4:bp,gn,bp ${variable.address},hp`);

        return inst;

    }

    parse_var_declaration(body = this.peek()) {

        let inst = [];

        const dType = body.dataType;
        const bytes = this.getDatatypeBytes(dType);


        this.frameSize += bytes;



        this.createScopeVar(body.varName, body.expression, dType, this.assignAddress(bytes))
        const variable = this.findVar(body.varName);



        (this.solveExpression(body.expression, bytes)).forEach(exp => {
            inst.push(exp);
        })
        inst.push(`COPY:${bytes}:bp,bp,bp ${variable.address},${this.t1}`)


        return inst;


    }

    parse_var_assign(body = this.peek()) {

        let inst = [];

        let refrenceVar = "";

        if (this.findVar(body.varName)) {
            refrenceVar = this.findVar(body.varName);
        } else {
            throw "cannot assign to veriable without defining "
        }




        const variable = {
            name: body.varName,
            expression: (body.expression?.left != null || body.expression?.right != null) ? body.expression : null,
            size: refrenceVar.size,
            dataType: refrenceVar.dataType,
            address: refrenceVar.address
        };


        const writeAccess = (this.findVar(variable.name).access == "global" ? "gn" : "bp");


        let expInst = this.solveExpression(body.expression, this.getDatatypeBytes(refrenceVar.dataType));
        expInst.forEach(exp => {
            inst.push(exp);
        })
        inst.push(`COPY:${variable.size}:gn,bp,${writeAccess} ${variable.address},${this.t1};`)





        return inst;




    }

    parse_block(block) {
        let newblock = new Scope(this.activeScope)
        this.activeScope = newblock;
        let ptr = 0;
        let inst = [];
        let frameSize = 0;
        while (ptr < block.length) {
            const opp = block[ptr];

            if (!opp) {
                throw "no operation is found inside the parse blck o"
            }



            this.parse_statements(opp).forEach(val => {
                inst.push(val);
            })






            ptr++;
        }

        this.activeScope = this.activeScope.parent;
        return inst;
    }

    parse_conditional = (body = this.peek()) => {
        let inst = [];
        let ind = 0;
        const len = body.length;
        let addersses = [];


        this.solveExpression(body.if.expression).forEach((single_inst) => {
            inst.push(single_inst);
        })
        inst.push(`LOADCI:4:bp,gn,gn ${this.t1},0;`)
        inst.push(`if_less_else_if 0`)
        inst.push(`if_eql_else_if 0`)
        this.parse_block(body.if.block.body).forEach((single_inst) => {
            inst.push(single_inst);
        })
        inst.push(`jmp_conditional_end`)


        body.elseif.forEach(cond => {
            addersses[ind] = inst.length+1;

            this.solveExpression(cond.expression).forEach((single_inst) => {
                inst.push(single_inst);
            })
            inst.push(`LOADCI:4:bp,gn,gn ${this.t1},0;`)
            inst.push(`if_less_else_if ${ind+1}`)
            inst.push(`if_eql_else_if ${ind+1}`)
            this.parse_block(cond.block.body).forEach((single_inst) => {
                inst.push(single_inst);
            })
            inst.push(`jmp_conditional_end`)

            ind++;
        })

        if (body.else) {
            addersses[ind] = inst.length + 1;
            this.parse_block(body.else.block.body).forEach((single_inst) => {
                inst.push(single_inst);
            })
            inst.push(`jmp_conditional_end`)
        }
        else {
            addersses[ind] = inst.length + 1;
        }





        inst = inst.map((line, ind) => {
            if (line == "jmp_conditional_end") {
                return `JMPoffset${inst.length + 1}|${ind}`;
            }
            let instSplit = line.split(" ");
            if (instSplit[0] == 'if_less_else_if') {

                return `IF_LESSoffset${addersses[instSplit[1]]}|${ind}`
            }
            if (instSplit[0] == 'if_eql_else_if') {
                return `IF_EQLoffset${addersses[instSplit[1]]}|${ind}`
            }

            return line;

        })

        // console.log("inside the conditional ");
        // console.log(inst);
        // console.log(addersses);

        return inst;
    }

    parse_while_loop(body) {
        let inst = [];
        let ind = 0;
        const len = body.length;
        let addersses = [];


        this.solveExpression(body.expression).forEach((single_inst) => {
            inst.push(single_inst);
        })
        inst.push(`LOADCI:4:bp,gn,gn ${this.t1},0;`)
        inst.push(`if_less_else_if 0`);
        inst.push(`if_eql_else_if 0`);
        this.parse_block(body.block.body).forEach((single_inst) => {
            inst.push(single_inst);
        })



        inst.push(`jmp_init_while ${inst.len}`);



        inst = inst.map((line, ind) => {
            let instSplit = line.split(" ");
            if (instSplit[0] == 'if_less_else_if') {
                return `IF_LESSoffset${inst.length + 1}|${ind}`
            }
            if (instSplit[0] == 'if_eql_else_if') {
                return `IF_EQLoffset${inst.length + 1}|${ind}`
            }
            if (instSplit[0] == 'jmp_init_while') {
                return `JMPoffset${1}|${ind}`
            }

            return line;

        })


        return inst;
    }
}






// let data = tokenize(`

// int demo(int param1){
//     int a = 10 ;
//     int b = a ;
//     b = a ;
// }

//     `)

// let parser = new Parser(data);



let backend = new AnnubisFuncBackend(
    {
        "type": "function_declaration",
        "funcName": "demo",
        "rtnType": "int",
        "params": [
            {
                "name": "param1",
                "dataType": "int",
                "type": "IDENTIFIERS"
            }
        ],
        "block": {
            "type": "Block",
            "body": [
                {
                    "type": "var_declaration",
                    "dataType": "int",
                    "varName": "a",
                    "expression": {
                        "main": {
                            "name": "10",
                            "type": "CONSTANTS"
                        },
                        "left": null,
                        "right": null
                    }
                },
                {
                    "type": "var_declaration",
                    "dataType": "int",
                    "varName": "b",
                    "expression": {
                        "main": {
                            "name": "a",
                            "type": "IDENTIFIERS"
                        },
                        "left": null,
                        "right": null
                    }
                },
                {
                    "type": "var_assignment",
                    "varName": "a",
                    "expression": {
                        "main": {
                            "name": "param1",
                            "type": "IDENTIFIERS"
                        },
                        "left": null,
                        "right": null
                    }
                },
                {
                    "type": "var_assignment",
                    "varName": "b",
                    "expression": {
                        "main": {
                            "name": "a",
                            "type": "IDENTIFIERS"
                        },
                        "left": null,
                        "right": null
                    }
                },
                {
                    "type": "var_declaration",
                    "dataType": "short",
                    "varName": "demo",
                    "expression": {
                        "main": {
                            "name": "param1",
                            "type": "IDENTIFIERS"
                        },
                        "left": null,
                        "right": null
                    }
                }
            ]
        }
    }

);

// backend.genAssembly();


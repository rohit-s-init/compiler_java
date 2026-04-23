import { AnnubisFuncBackend } from "./AnnubisFuncBackend.js";

export class AnnubisBackend {
    constructor(ast) {
        this.ast = ast;
        this.pos = 0;
        this.varTable = [];
        this.funcTable = [];
        this.funcOffSet = 0xFFFF;
        this.assignedAdd = 0xFFFF;
        this.instructions = [];
        this.operator = "OPERATOR";
        this.constant = "CONSTANTS";
        this.identifier = "IDENTIFIERS";
        this.heapPtrase = 0xF
    }
    peek(i = 0) {
        return this.ast[this.pos + i];
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
    findVar(varName) {
        return this.varTable.find((value) => (value.name == varName));
    }


    genAssembly() {

        this.pushInst(`UPDATE_STACK_D:4 0xffff;`)
        this.pushInst(`LOAD:1 hp,${this.heapPtrase}`)

        let assembly = [];

        let funcOffSet = 0;

        while (this.peek()) {
            let isArgumentParsed = false;



            if (this.peek()?.type == "var_declaration") {
                assembly.push(this.parse_statements());
                isArgumentParsed = true;
            }

            if (this.peek()?.type == "var_assignment") {
                assembly.push(this.parse_statements());
                isArgumentParsed = true;
            }

            if (this.peek()?.type == "function_declaration") {
                let func = new AnnubisFuncBackend(this.peek(), this.varTable, this.funcTable);
                func.genAssembly();

                this.funcTable.push(func);

                isArgumentParsed = true;
                this.consume();


            }


            if (!isArgumentParsed) {
                throw "invalid syntax buddy , check for some weird keyword or syntax" + JSON.stringify(this.peek())
            }





        }

        this.pushInst(`PUSH_STACK_D:4 temp_data;`)
        this.pushInst(`CALL main`)
        this.pushInst(`USER_INP:1 temp_data`);



        funcOffSet = assembly.length;


        //assigni8ng proper offset function address
        let tempFuncAdd = this.instructions.length;
        this.funcTable.forEach(funcData => {
            funcData.functionAddress = tempFuncAdd;
            tempFuncAdd += funcData.instructions.length;
        })






        for (let i = 0; i < this.funcTable.length; i++) {
            this.funcTable[i].updateFuncAddress(funcOffSet)
            this.pushInst(this.funcTable[i].instructions);
            funcOffSet += this.funcTable[i].instructions.length;
        }

        this.instructions.forEach((val, ind) => {
            if (val == "jmp_func_end") {

            }
            if (val.includes("offset")) {
                let [offset, instInd] = val.split("offset")[1].split("|");
                this.instructions[ind] = `${val.split("offset")[0]}:1 ${(ind - parseInt(instInd) + parseInt(offset) - 1) * 2}`
            }
            if (val.includes("jmp_init_while")) {
                let [offset, instInd] = val.split("offset")[1].split("|");
                this.instructions[ind] = `${val.split("offset")[0]}:1 ${(ind - parseInt(instInd) + parseInt(offset) - 1) * 2}`
            }
            if (val.split(" ")[0] == "CALL") {
                try {
                    const funcName = val.split(" ")[1];

                    let fundData = this.funcTable.find(val => {
                        return val.ast.funcName == funcName
                    })

                    this.instructions[ind] = `CALL:4 ${fundData.functionAddress * 2}`
                } catch (error) {
                    throw ("cannot find the function " + val);
                }


            }
            if (val.split(" ")[0] == "jmp_func_end") {
                try {
                    const funcName = val.split(" ")[1];

                    let fundData = this.funcTable.find(val => {
                        return val.ast.funcName == funcName
                    })

                    this.instructions[ind] = `JMP ${(fundData.functionAddress + fundData.instructions.length - 5) * 2}`
                } catch (error) {
                    throw ("cannot find the function " + val);
                }


            }
        })





        return assembly;
    }



    parse_statements() {
        if (this.peek()?.type == "var_declaration") {
            return (this.parse_var_declaration());
        }

        if (this.peek()?.type == "var_assignment") {
            return (this.parse_var_assign());
        }

    }


    parse_var_declaration() {


        let getAssemblyForExpStack = (list, bytes, type) => {


            let priority_stack = list.reverse();
            let temp_stack = [];
            let isT1Occupied = false;
            let pT1 = 0;
            let inst = [];


            let t1 = -1;
            let len = priority_stack.length;

            let getOppName = function (opp) {
                if (opp == "+") {
                    return "ADD"
                }
                if (opp == "*") {
                    return "MUL"
                }
            }



            if (list.length == 1) {
                if (list[0].type == "IDENTIFIERS") {
                    inst.push(`${sp} <- ${this.findVar(val => (val.name == list[0].name)).address}`)
                    return;
                }
            }

            for (let i = 0; i < len; i++) {
                let entry = priority_stack.pop();

                if (entry.type != "OPERATOR") {
                    temp_stack.push(entry);
                    if (isT1Occupied) {
                        pT1++;
                        if (pT1 == 3) {

                            inst.push(`PUSH_STACK_D:${bytes} t1;`);
                            isT1Occupied = false;
                            pT1 = 0;

                        }

                    }


                    continue;
                }

                let opp = entry.name;

                if (isT1Occupied == false) {
                    let a0 = temp_stack.pop();
                    if (a0.type == "ram_used") {
                        inst.push(`POP_STACK:${bytes} t1;\n`);
                    }
                    let b0 = temp_stack.pop();
                    if (b0.type == "ram_used") {
                        inst.push(`POP_STACK:${bytes} t1;\n`);
                    }



                    if (a0.type == this.constant) {
                        inst.push(`LOAD:${bytes} t2,${a0.name}`);
                    }
                    else if (a0.type == this.identifier) {
                        if (this.findVar(a0.name).dataType != type) {
                            throw {
                                tokenNo: this.pos,
                                err: "type not matching buddy " + this.peek().varName
                            }
                        }
                        inst.push(`COPY:${bytes} t2,${this.findVar(a0.name).address}`);
                    }
                    else if (a0.type == "use_ram") {
                        inst.push(`POP_STACK:${bytes} t2`);
                    }

                    if (b0.type == this.constant) {
                        inst.push(`LOAD:${bytes} t3,${b0.name}`);
                    }
                    else if (b0.type == this.identifier) {
                        if (this.findVar(b0.name).dataType != type) {
                            throw {
                                tokenNo: this.pos,
                                err: "type not matching buddy " + this.peek().varName
                            }
                        }
                        inst.push(`COPY:${bytes} t3,${this.findVar(b0.name).address}`);
                    }
                    else if (b0.type == "use_ram") {
                        inst.push(`POP_STACK:${bytes} t3`);
                    }

                    inst.push(`${getOppName(opp)}:${bytes} t2,t3,t1`);

                    temp_stack.push({ type: 'use_ram', name: "stack_pop()" });

                    isT1Occupied = true;
                }
                else if (isT1Occupied == true) {
                    if (pT1 == 1) {
                        let a0 = t1;
                        temp_stack.pop();
                        let b0 = temp_stack.pop();



                        if (b0.type == this.constant) {
                            inst.push(`LOAD:${bytes} t2,${b0.name}`)
                        }
                        else if (b0.type == this.identifier) {
                            if (this.findVar(b0.name).dataType != type) {
                                throw {
                                    tokenNo: this.pos,
                                    err: "type not matching buddy " + this.peek().varName
                                }
                            }
                            inst.push(`COPY:${bytes} t2,${this.findVar(b0.name).address}`);
                        }
                        else if (b0.type == "use_ram") {
                            inst.push(`POP_STACK:${bytes} t2;`);
                        }
                        inst.push(`${getOppName(opp)}I:${bytes} t1,t2;`)

                        pT1 = 0;

                        temp_stack.push({ type: 'use_ram', name: "stack_pop()" });
                    }
                    if (pT1 == 2) {
                        let a0 = temp_stack.pop();
                        let b0 = t1;
                        temp_stack.pop()


                        if (a0.type == this.constant) {
                            inst.push(`LOAD:${bytes} t2,${a0.name};`)
                        }
                        else if (a0.type == this.identifier) {
                            if (this.findVar(a0.name).dataType != type) {
                                throw "type not matching buddy " + this.peek().varName

                            }
                            inst.push(`COPY:${bytes} t2,${this.findVar(a0.name).address}`);
                        }
                        else if (a0.type == "use_ram") {
                            inst.push(`POP_STACK:${bytes} t2`);
                        }
                        inst.push(`${getOppName(opp)}I:${bytes} t2,t1;`)


                        pT1 = 0;

                        temp_stack.push({ type: 'use_ram', name: "stack_pop()" });
                    }
                }
                if (isT1Occupied) {
                    pT1++;
                    if (pT1 == 3) {

                        inst.push(`PUSH_STACK:${bytes} t1;`);
                        isT1Occupied = false;
                        pT1 = 0;

                    }

                }



            }


            return inst;
        }

        let getExpressionStack = () => {


            let arr = [];
            let printPostorder = (expTree, parentExpTree) => {

                if (!parentExpTree) {
                }



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

            printPostorder(this.peek().expression);

            return arr;
        }


        if (this.peek().dataType == "int") {


            this.varTable.push({
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 4,
                dataType: "int",
                address: this.assignAddress(4)
            })

            const variable = this.findVar(this.peek().varName);


            if (variable.constDeclr) {
                this.pushInst(`PUSH_STACK_D:4 ${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:4 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
                this.pushInst(`INC_STACK_D:1 4`);
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 4, "int"));
                this.pushInst(expInst)
                this.pushInst(`PUSH_STACK_R:4 t1;`)
            }



            this.consume();


        }
        else if (this.peek().dataType == "short") {


            this.varTable.push({
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 2,
                dataType: "short",
                address: this.assignAddress(2)
            })

            const variable = this.findVar(this.peek().varName);


            if (variable.constDeclr) {
                this.pushInst(`PUSH_STACK_D:2 ${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:2 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
                this.pushInst(`INC_STACK_D:1 2`);
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 2, "short"));
                this.pushInst(expInst)
                this.pushInst(`PUSH_STACK_R:2 t1;`)
            }



            this.consume();


        }
        else if (this.peek().dataType == "byte") {


            this.varTable.push({
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 1,
                dataType: "byte",
                address: this.assignAddress(1)
            })

            const variable = this.findVar(this.peek().varName);


            if (variable.constDeclr) {
                this.pushInst(`PUSH_STACK_D:1 ${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:1 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
                this.pushInst(`INC_STACK_D:1 1`);
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 1, "byte"));
                this.pushInst(expInst)
                this.pushInst(`PUSH_STACK_R:1 t1;`)
            }



            this.consume();


        }
    }

    parse_var_assign() {
        let refrenceVar = "";


        let getAssemblyForExpStack = (list, bytes, type) => {


            let priority_stack = list.reverse();
            let temp_stack = [];
            let isT1Occupied = false;
            let pT1 = 0;
            let inst = [];


            let t1 = -1;
            let len = priority_stack.length;

            let getOppName = function (opp) {
                if (opp == "+") {
                    return "ADD"
                }
                if (opp == "*") {
                    return "MUL"
                }
            }



            if (list.length == 1) {
                if (list[0].type == "IDENTIFIERS") {
                    inst.push(`${sp} <- ${this.findVar(val => (val.name == list[0].name)).address}`)
                    return;
                }
            }

            for (let i = 0; i < len; i++) {
                let entry = priority_stack.pop();

                if (entry.type != "OPERATOR") {
                    temp_stack.push(entry);
                    if (isT1Occupied) {
                        pT1++;
                        if (pT1 == 3) {

                            inst.push(`PUSH_STACK_D:${bytes} t1;`);
                            isT1Occupied = false;
                            pT1 = 0;

                        }

                    }


                    continue;
                }

                let opp = entry.name;

                if (isT1Occupied == false) {
                    let a0 = temp_stack.pop();
                    if (a0.type == "ram_used") {
                        inst.push(`POP_STACK:${bytes} t1;\n`);
                    }
                    let b0 = temp_stack.pop();
                    if (b0.type == "ram_used") {
                        inst.push(`POP_STACK:${bytes} t1;\n`);
                    }



                    if (a0.type == this.constant) {
                        inst.push(`LOAD:${bytes} t2,${a0.name}`);
                    }
                    else if (a0.type == this.identifier) {
                        if (this.findVar(a0.name).dataType != type) {
                            throw {
                                tokenNo: this.pos,
                                err: "type not matching buddy " + this.peek().varName
                            }
                        }
                        inst.push(`COPY:${bytes} t2,${this.findVar(a0.name).address}`);
                    }
                    else if (a0.type == "use_ram") {
                        inst.push(`POP_STACK:${bytes} t2`);
                    }

                    if (b0.type == this.constant) {
                        inst.push(`LOAD:${bytes} t3,${b0.name}`);
                    }
                    else if (b0.type == this.identifier) {
                        if (this.findVar(b0.name).dataType != type) {
                            throw {
                                tokenNo: this.pos,
                                err: "type not matching buddy " + this.peek().varName
                            }
                        }
                        inst.push(`COPY:${bytes} t3,${this.findVar(b0.name).address}`);
                    }
                    else if (b0.type == "use_ram") {
                        inst.push(`POP_STACK:${bytes} t3`);
                    }

                    inst.push(`${getOppName(opp)}:${bytes} t2,t3,t1`);

                    temp_stack.push({ type: 'use_ram', name: "stack_pop()" });

                    isT1Occupied = true;
                }
                else if (isT1Occupied == true) {
                    if (pT1 == 1) {
                        let a0 = t1;
                        temp_stack.pop();
                        let b0 = temp_stack.pop();



                        if (b0.type == this.constant) {
                            inst.push(`LOAD:${bytes} t2,${b0.name}`)
                        }
                        else if (b0.type == this.identifier) {
                            if (this.findVar(b0.name).dataType != type) {
                                throw {
                                    tokenNo: this.pos,
                                    err: "type not matching buddy " + this.peek().varName
                                }
                            }
                            inst.push(`COPY:${bytes} t2,${this.findVar(b0.name).address}`);
                        }
                        else if (b0.type == "use_ram") {
                            inst.push(`POP_STACK:${bytes} t2;`);
                        }
                        inst.push(`${getOppName(opp)}I:${bytes} t1,t2;`)

                        pT1 = 0;

                        temp_stack.push({ type: 'use_ram', name: "stack_pop()" });
                    }
                    if (pT1 == 2) {
                        let a0 = temp_stack.pop();
                        let b0 = t1;
                        temp_stack.pop()


                        if (a0.type == this.constant) {
                            inst.push(`LOAD:${bytes} t2,${a0.name};`)
                        }
                        else if (a0.type == this.identifier) {
                            if (this.findVar(a0.name).dataType != type) {
                                throw "type not matching buddy " + this.peek().varName

                            }
                            inst.push(`COPY:${bytes} t2,${this.findVar(a0.name).address}`);
                        }
                        else if (a0.type == "use_ram") {
                            inst.push(`POP_STACK:${bytes} t2`);
                        }
                        inst.push(`${getOppName(opp)}I:${bytes} t2,t1;`)


                        pT1 = 0;

                        temp_stack.push({ type: 'use_ram', name: "stack_pop()" });
                    }
                }
                if (isT1Occupied) {
                    pT1++;
                    if (pT1 == 3) {

                        inst.push(`PUSH_STACK:${bytes} t1;`);
                        isT1Occupied = false;
                        pT1 = 0;

                    }

                }



            }


            return inst;
        }

        let getExpressionStack = () => {


            let arr = [];
            let printPostorder = (expTree, parentExpTree) => {

                if (!parentExpTree) {
                }



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

            printPostorder(this.peek().expression);

            return arr;
        }

        if (this.findVar(this.peek().varName)) {
            refrenceVar = this.findVar(this.peek().varName);
        } else {
            throw "cannot assign to veriable without defining "
        }

        if (refrenceVar.dataType == "int") {


            const variable = {
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 4,
                dataType: "int",
                address: refrenceVar.address
            };


            if (variable.constDeclr) {
                this.pushInst(`LOAD:4 ${variable.address},${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:4 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 4, "int"));
                this.pushInst(expInst)
                this.pushInst(`COPY:4 ${refrenceVar.address},t1;`)
            }



            this.consume();


        }
        else if (refrenceVar.dataType == "short") {


            const variable = {
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 2,
                dataType: "int",
                address: refrenceVar.address
            };


            if (variable.constDeclr) {
                this.pushInst(`LOAD:2 ${variable.address},${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:2 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 2, "short"));
                this.pushInst(expInst)
                this.pushInst(`COPY:2 ${refrenceVar.address},t1;`)
            }



            this.consume();


        }
        else if (refrenceVar.dataType == "byte") {


            const variable = {
                name: this.peek().varName,
                constDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main.name : null) : null,
                varDeclr: (this.peek().expression?.left == null && this.peek().expression?.right == null) ? (!parseInt(this.peek().expression?.main.name) ? this.peek().expression?.main : null) : null,
                expression: (this.peek().expression?.left != null || this.peek().expression?.right != null) ? this.peek().expression : null,
                size: 1,
                dataType: "int",
                address: refrenceVar.address
            };


            if (variable.constDeclr) {
                this.pushInst(`LOAD:1 ${variable.address},${variable.constDeclr}`)
            }
            else if (variable.varDeclr) {
                this.pushInst(`COPY:1 ${variable.address},${this.findVar(variable.varDeclr.name).address}`)
            }
            else if (variable.expression) {
                let executionStack = getExpressionStack(this.peek().expression);
                let expInst = (getAssemblyForExpStack(executionStack, 1, "byte"));
                this.pushInst(expInst)
                this.pushInst(`COPY:1 ${refrenceVar.address},t1;`)
            }



            this.consume();


        }
    }
}


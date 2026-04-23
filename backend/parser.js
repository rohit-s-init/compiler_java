import { tokenize } from "./LexicalAnalysis.js";


export default class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.parseTree = [];
        this.lineNo = 0;
        this.vars = [
            {
                name: "int",
                bytes: 4
            },
            {
                name: "short",
                bytes: 2
            },
            {
                name: "long",
                bytes: 4
            },
            {
                name: "char",
                bytes: 1
            }
        ]
    }
    peek(i = 0) {
        return this.tokens[this.pos + i];
    }
    consume(tokObj) {
        const tok = this.peek();
        this.pos++;
        return tok;
    }
    parseProgram() {


        const body = [];
        while (this.peek()) {

            let hasCompiled = false;


            if (this.peek(2)?.name == "=" && this.peek(1)?.type == "IDENTIFIERS" && this.peek()?.type == "KEYWORD") {
                let pTree = (this.parseVariableDeclr())
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek(1)?.name == "=" && this.peek()?.type == "IDENTIFIERS") {
                let pTree = (this.parseAssignmentStatement());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek()?.name == "if" && this.peek(1)?.name == "(") {
                let pTree = (this.parseConditional());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek()?.type == "KEYWORD" && this.peek(1)?.type == "IDENTIFIERS" && this.peek(2)?.name == "(") {
                let pTree = (this.parseFunctionDefine());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek()?.type == "IDENTIFIERS" && this.peek(1)?.name == "(") {
                let pTree = (this.functionCalling());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek()?.type == "KEYWORD" && this.peek()?.name == "while") {
                let pTree = (this.parserWhileLoop());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }
            if (this.peek()?.type == "KEYWORD" && this.peek()?.name == "return") {
                let pTree = (this.parseReturnStatement());
                if (pTree?.error) {
                    return (pTree.error)
                }
                body.push(pTree);
                hasCompiled = true;
            }




            if (this.peek() == ";") {
                this.consume();
                this.lineNo++;
            }


        }
        return { type: "Program", body };
    }

    parseStatement() {
        const t = this.peek();

        if (t.type === "IDENT" && t.value === "int") {
            return this.parseVarDecl();
        }

        if (t.type === "IDENT") {
            return this.parseAssignment();
        }

        throw new Error("Unexpected token: " + t.type);
    }









    parseBlock() {
        this.consume({ name: "{", type: "PUNCUATION" });

        const body = [];
        while (this.peek() && this.peek()?.name !== "}") {
            body.push(this.parseStatements());
        }

        this.consume({ name: "}", type: "PUNCUATION" });

        return { type: "Block", body };
    }

    parseStatements() {

        if (this.peek(2)?.name == "=" && this.peek(1)?.type == "IDENTIFIERS" && this.peek()?.type == "KEYWORD") {
            return this.parseVariableDeclr();
        }
        if (this.peek(1)?.name == "=" && this.peek()?.type == "IDENTIFIERS") {
            return this.parseAssignmentStatement();
        }
        if (this.peek()?.name == "if" && this.peek(1)?.name == "(") {
            return this.parseConditional();
        }
        if (this.peek()?.type == "KEYWORD" && this.peek(1)?.type == "IDENTIFIERS" && this.peek(2)?.name == "(" && this.vars.find(val => this.peek()?.name == val)) {
            return this.parseFunctionDefine();
        }
        if (this.peek()?.type == "IDENTIFIERS" && this.peek(2)?.name == "(") {
            return this.functionCalling();
        }
        if (this.peek()?.name == "return") {
            return this.parseReturnStatement();
        }
        if (this.peek()?.name == "while") {
            return this.parserWhileLoop();
        }
        if (this.peek(1).name == "[" && this.peek(2).name == "]") {
            return this.parseArrayDeclr();
        }
        else if (this.peek(1).name == "[") {
            return this.parseWriteArr();
        }
        try {
            return {
                type: "expression",
                expression: this.parseExpression()
            };
        } catch (error) {
            console.log(error)
        }
    }






    parseWriteArr() {
        let name = this.peek().name;
        this.consume();
        this.consume("[")
        let index = this.parseExpression();
        this.consume("]")
        this.consume("=");
        let val = this.parseExpression();

        return {
            type: "array_write",
            name: name,
            index: index,
            val: val
        }


    }


    parseArrayDeclr() {

        let dataType = this.peek().name;
        this.consume();

        this.consume("[")
        this.consume("]")

        let arrName = this.peek().name;

        this.consume();

        this.consume("=");

        this.consume("new");
        this.consume(dataType);
        this.consume("[");

        let eleSize = this.parseExpression();

        this.consume("]");



        return {
            type: "aray_declration",
            dataType: dataType,
            name: arrName,
            eleSize: eleSize
        }
    }

    parserWhileLoop() {
        this.consume({ name: "while", type: "KEYWORD" });
        this.consume({ name: "(", type: "PUNCUATION" });
        let expression = this.parseExpression();
        this.consume({ name: ")", type: "PUNCUATIONS" });
        let block = this.parseBlock();
        return {
            type: "while_loop",
            expression: expression,
            block: block
        }

    }

    parseFunctionDefine() {
        let returnType = this.peek()?.name;
        this.consume({ name: undefined, type: "KEYWORD" });
        let funcName = this.peek()?.name;
        this.consume({ name: undefined, type: "IDENTIFIER" });
        this.consume({ name: "(", type: "PUNCUATION" });

        let params = [];

        while (this.peek()?.name != ")") {

            params.push({
                name: this.peek(1)?.name,
                dataType: this.peek()?.name,
                type: this.peek(1)?.type,
            })
            this.consume({ name: undefined, type: "KEYWORD" });
            this.consume({ name: undefined, type: "IDENTIFIERS" });

            if (this.peek()?.name == ",") {
                this.consume({ name: ",", type: "PUNCUATION" });
            }

        }

        this.consume({ name: ")", type: "PUNCUATION" });

        let block = this.parseBlock();

        return {
            type: "function_declaration",
            funcName: funcName,
            rtnType: returnType,
            params: params,
            block: block
        }


    }

    functionCalling() {
        let name = this.peek()?.name;
        this.consume({ name: undefined, type: "IDENTIFIERS" });
        this.consume({ name: "(", type: "PUNCUATION" });

        let params = [];

        while (this.peek()?.name != ")") {

            params.push({
                name: this.parseExpression()
            })

            if (this.peek()?.name == ",") {
                this.consume({ name: ",", type: "PUNCUATION" });
            }
            else {
                break;
            }

        }

        this.consume({ name: ")", type: "PUNCUATION" });


        return {
            type: "function_calling",
            name: name,
            params: params
        }

    }

    arrayAccessing() {
        let name = this.peek()?.name;
        this.consume({ name: undefined, type: "IDENTIFIERS" });
        this.consume({ name: "[", type: "PUNCUATION" });

        let indexExp = this.parseExpression();

        this.consume({ name: "]", type: "PUNCUATION" });


        return {
            type: "arrary_accesing",
            name: name,
            indexExp: indexExp
        }

    }

    parseReturnStatement() {
        this.consume({ name: "return", type: "KEYWORD" });
        return {
            type: "rtn_statement",
            expression: this.parseExpression()
        }
    }

    parseConditional() {
        this.consume({ name: "if", type: "KEYWORD" });
        this.consume({ name: "(", type: "PUNCUATION" });
        let conditionalExp = this.parseExpression();
        this.consume({ name: ")", type: "PUNCUATION" });
        const ifBlock = this.parseBlock();
        let ifBody = {
            expression: conditionalExp,
            block: ifBlock
        }

        const elseIfBody = [];
        while (this.peek()?.name == "else" && this.peek(1)?.name == "if") {
            this.consume({ name: "else", type: "KEYWORD" });
            this.consume({ name: "if", type: "KEYWORD" });
            this.consume({ name: "(", type: "PUNCUATION" });
            let conditionalElseExp = this.parseExpression();
            this.consume({ name: ")", type: "PUNCUATION" });
            let conditionalElseBlock = this.parseBlock();

            elseIfBody.push({
                expression: conditionalElseExp,
                block: conditionalElseBlock
            })
        }

        let elseBody;
        if (this.peek()?.name == "else") {
            this.consume({ name: "else", type: "KEYWORD" });
            let conditionalElseBlock = this.parseBlock();
            elseBody = {
                block: conditionalElseBlock
            };
        }

        return {
            type: "conditional_statements",
            if: ifBody,
            elseif: elseIfBody,
            else: elseBody
        }
    }

    parseVariableDeclr() {
        let dataType = this.peek()?.name;
        this.consume({ name: undefined, type: "KEYWORD" });
        let varName = this.peek()?.name;
        this.consume({ name: undefined, type: "IDENTIFIERS" });
        this.consume({ name: "=", type: "OPERATOR" });
        let expression = this.parseExpression();

        return {
            type: "var_declaration",
            dataType: dataType,
            varName: varName,
            expression: expression
        }


    }

    parseAssignmentStatement() {
        let varName = this.peek()?.name;
        this.consume({ name: undefined, type: "IDENTIFIERS" });
        this.consume({ name: "=", type: "OPERATOR" });
        let expression = this.parseExpression();

        return {
            type: "var_assignment",
            varName: varName,
            expression: expression
        }
    }









    parseExpression() {

        if (this.peek()?.type == "STRING") {
            let str = this.peek();
            this.consume();

            return {
                string: str.name.substr(1,str.name.length-2),
            }
        }
        let node = this.parseLogical();
        return node;
    }

    parseLogical() {
        let node = this.parseEquality();
        while (this.peek()?.name == "&&" || this.peek()?.name == "||") {
            const opp = this.peek().name;
            this.consume({ name: "&&", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseEquality() };
        }
        return node;
    }

    parseEquality() {
        let node = this.parseComparator();
        while (this.peek()?.name == "==" || this.peek()?.name == "!=") {
            const opp = this.peek()?.name;
            this.consume({ name: "==", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseComparator() };
        }
        return node;
    }

    parseComparator() {
        let node = this.parseShift();
        while (this.peek()?.name == ">" || this.peek()?.name == "<" || this.peek()?.name == ">=" || this.peek()?.name == "<=") {
            const opp = this.peek().name;
            this.consume({ name: ">", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseAdder() };
        }
        return node;
    }

    parseShift() {
        let node = this.parseAdder();
        while (this.peek()?.name == ">>" ||this.peek()?.name == "<<" ) {
            const opp = this.peek().name;
            this.consume({ name: ">", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseAdder() };
        }
        return node;
    }

    parseAdder() {
        let node = this.parseMult();
        while (this.peek()?.name == "+" || this.peek()?.name == "-") {
            const opp = this.peek()?.name;
            this.consume({ name: "+", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseMult() };
        }
        return node;
    }

    parseMult() {
        let node = this.parseMod();
        while (this.peek()?.name == "*" || this.peek()?.name == "/") {
            const opp = this.peek().name;
            this.consume({ name: "*", type: "OPERATOR" })
            node = { main: { name: opp, type: "OPERATOR" }, left: node, right: this.parseMod() };
        }
        return node;
    }

    parseMod() {
        let node = this.parsePrimary();
        while (this.peek()?.name == "%") {
            this.consume({ name: "%", type: "OPERATOR" })
            node = { main: { name: "%", type: "OPERATOR" }, left: node, right: this.parsePrimary() };
        }
        return node;
    }

    parsePrimary() {

        if (!this.peek()) return null;
        if (this.peek()?.type == "CONSTANTS") {
            let node = { main: this.peek(), left: null, right: null };
            this.consume({ name: undefined, type: "CONSTANTS" })
            return node;
        }
        if (this.peek()?.type == "CHARACTER") {
            let node = { main: this.peek(), left: null, right: null };
            this.consume({ name: undefined, type: "CONSTANTS" })
            return node;
        }
        if (this.peek()?.type == "IDENTIFIERS") {
            let node = { main: this.peek(), left: null, right: null };

            if (this.peek(1)?.name == "(") {
                return { main: this.functionCalling(), left: null, right: null };

            }
            else if (this.peek(1)?.name == "[") {
                return { main: this.arrayAccessing(), left: null, right: null };
            }
            this.consume({ name: undefined, type: "IDENTIFIERS" })

            return node;
        }

        if (this.peek()?.name == "(") {
            this.consume({ name: "(", type: "PUNCUATION" });
            let exp = this.parseExpression();
            this.consume({ name: ")", type: "PUNCUATION" });
            return exp;
        }


        throw new Error("Unexpected token: " + JSON.stringify(this.peek()));


    }





}


let data = tokenize(`

let main(){
    let a = player << 1;
}
    `)

let parser = new Parser(data);
let tree = parser.parseProgram();
console.log(tree)

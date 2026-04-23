
const TokenSpec = {
    keywords: [
        "int", "short", "let", "var", "if", "else", "while", "for", "byte",
        "function", "return", "class", "object", "new", "true", "false", "null"
    ],

    operators: [
        "+", "-", "*", "/", "%", "=", "==", "!=", ">=", "<=", ">", "<",
        "&&", "||", "!", ".", "++", "--", "&", "|", "<<", ">>"
    ],

    punctuation: [
        "(", ")", "{", "}", "[", "]", ";", ",", ":", "?"
    ],

    strings: [],

    constants: [],

    identifiers: []
};





let programm = [];


function getTokenPackage(word) {

    let returnVal = undefined;
    TokenSpec.keywords.forEach((val) => {
        if (val == word) {
            returnVal = ({ name: val, type: "KEYWORD" });
        }
    })
    TokenSpec.operators.forEach((val) => {
        if (val == word) {
            returnVal = ({ name: val, type: "OPERATOR" });
        }
    })
    TokenSpec.punctuation.forEach((val) => {
        if (val == word) {
            returnVal = ({ name: val, type: "PUNCUATION" });
        }
    })
    if (returnVal) {
        return returnVal;
    }

    if (word.split("")[0] == `"` && word.split("")[word.split("").length - 1] == `"`) {
        return ({ name: word, type: "STRING" });
    }
    if (word.split("")[0] == `'` && word.split("")[2] == `'`) {
        return ({ name: word, type: "CHARACTER" });
    }
    if ((word.charCodeAt(0) >= 65 && word.charCodeAt(0) <= 122) || word.charCodeAt(0) == 95) {
        word.split("").forEach((val, ind) => {
            if (ind != 0) {
                if ((val.charCodeAt(0) >= 65 && val.charCodeAt(0) <= 122)) {

                }
                else {
                    return new Error("no such thing exist in the programming language");
                }
            }
        })

        return {
            name: word, type: "IDENTIFIERS"
        }
    }
    if ((word.charCodeAt(0) >= 48 && word.charCodeAt(0) <= 57)) {
        word.split("").forEach((val, ind) => {
            if (ind != 0) {
                if ((val.charCodeAt(0) >= 48 && val.charCodeAt(0) <= 57)) {

                }
                else {
                    return new Error("no such thing exist in the programming language");
                }
            }
        })

        return {
            name: word, type: "CONSTANTS"
        }
    }




}


let pushChar = "";
export function tokenize(line) {
    line = line.trim().split(";").join("").split("\n").join(" ");
    let tokens = [];

    let word = "";
    let stringCheck = false;
    line.split("").forEach(element => {


        if (element == `"`) {

            if (!stringCheck) {
                stringCheck = true;
            }
            else if (stringCheck) {
                stringCheck = false;

            }

        }

        if (stringCheck) {
            word += element;
            return;
        }
        else {


            if (TokenSpec.operators.find((val) => ((pushChar + element) == val))) {

                tokens.pop();

                tokens.push({
                    name: (pushChar + element),
                    type: "OPERATOR"
                })
                word = "";
                pushChar = element;
                return;
            }

            if (TokenSpec.operators.find((val) => ((element) == val))) {

                let tokenPack = getTokenPackage(word);
                if (tokenPack) {
                    tokens.push(tokenPack);
                }

                tokens.push({
                    name: element,
                    type: "OPERATOR"
                })
                word = "";
                pushChar = element;
                return;
            }

            if (TokenSpec.punctuation.find((val) => ((element) == val))) {

                let tokenPack = getTokenPackage(word);
                if (tokenPack) {
                    tokens.push(tokenPack);
                }

                tokens.push({
                    name: element,
                    type: "PUNCUATION"
                })
                word = "";
                pushChar = element;
                return;
            }




            if (element == " ") {


                let tokenPack = getTokenPackage(word);
                if (tokenPack) {
                    tokens.push(tokenPack);
                }



                word = "";
                return;
            }




            word += element;
            pushChar = element;
        }

    });







    // just for now we will convert let to int 
    tokens = tokens.map(token => {
        if (token.name == "let") {
            return { name: 'int', type: 'KEYWORD' };
        }
        else {
            return token;
        }
    })

    console.log(tokens);











    return tokens;
}



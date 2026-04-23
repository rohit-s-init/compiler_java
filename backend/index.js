let express = require("express");
let fs = require("node:fs/promises");
const { tokenize } = require("./LexicalAnalysis");
const { default: Parser } = require("./parser");
const { AnnubisBackend } = require("./AnnubisBackend");
const { default: asmtobin } = require("./asmtobin");
const path = require("node:path");
let app = express()





app.use(express.static("public"))

app.use(express.json())



app.get("/getfilesnames", (req, res) => {
    fs.readdir(path.join(__dirname, "./Repo")).then(val => {
        res.send(JSON.stringify({
            repo: val
        }))
    });
})

app.post("/readFile", express.text(), (req, res) => {
    fs.readFile("./Repo/" + JSON.parse(req.body).fileName, "utf8").then(val => {
        res.send(val);
    }).catch((err) => {
        res.send("error in reading file");
    })
})

app.post("/savefile", express.text(), (req, res) => {
    fs.writeFile(path.join(__dirname, "Repo//" + JSON.parse(req.body).fileName), JSON.parse(req.body).data).then((val) => {
        res.send("pass")
    }).catch(err => {
    })
})

app.post("/createfile", express.text(), (req, res) => {
    let fileName = JSON.parse(req.body).fileName;
    fs.appendFile(path.join(__dirname, "Repo", `${fileName}`), "");
    res.send({ status: "pass" })
})

app.post("/run", express.text(), (req, res) => {
    let fileName = JSON.parse(req.body).fileName;


    fs.readFile("./Repo/" + fileName, "utf8").then(data => {


        let parser = new Parser(tokenize(data));


        try {
            let parseTree = (parser.parseProgram());
            let backend = new AnnubisBackend(parseTree.body);
            backend.genAssembly();
            const assembly = backend.instructions;
            const hex = asmtobin(assembly).join("\n");


            fs.writeFile(path.join(__dirname, "Repo", `${fileName.split(".")[0]}.lasm`), assembly.join("\n"));
            fs.writeFile(path.join(__dirname, "Repo", `${fileName.split(".")[0]}.hex`), "v2.0 raw\n" + hex);

            res.send(JSON.stringify({
                assembly: assembly,
                hex: hex
            }));

        } catch (error) {
            res.send(JSON.stringify({
                error: ("Error : " + error + "\n")
            }));
        }



    }).catch((err) => {
        console.log(err);
        res.send("error in reading file");


    })

    fs.writeFile(path.join(__dirname, "Repo//" + JSON.parse(req.body).fileName), JSON.parse(req.body).data).then((val) => {
        res.send("pass")
    }).catch(err => {
    })
})

app.post("/save", (req, res) => {
    let data = req.body;

    let str = "v2.0 raw\n" + data.hexData.join("\n");


    fs.writeFile("code.hex", str).then((val) => {
        res.send("pass")
    }).catch(err => {
    })

})


app.post("/compile", (req, res) => {
    let data = req.body;

    let parser = new Parser(tokenize(data.code));
    let lineTokenMatrix = [];
    data.code.split(";").join("").split("\n").forEach(element => {
        lineTokenMatrix.push({
            line: element,
            tokens: tokenize(element).length + 1
        })
    });
    function getErrorLineFromToken(tokenNo) {
        let totalTokensNo = 0;
        for (let i = 0; i < lineTokenMatrix.length; i++) {

            if ((totalTokensNo + lineTokenMatrix[i].tokens) >= tokenNo) {
                return ("line no " + i + " : " + lineTokenMatrix[i].line);
            }

            totalTokensNo += lineTokenMatrix[i].tokens;
        }
    }

    try {
        let parseTree = (parser.parseProgram());
        let backend = new AnnubisBackend(parseTree.body);
        backend.genAssembly();
        const assembly = backend.instructions;
        const hex = asmtobin(assembly).join("\n");
        res.send(JSON.stringify({
            assembly: assembly,
            hex: hex
        }));

    } catch (error) {
        console.log(error);
        let errLine = (getErrorLineFromToken(error.tokenNo));
        res.send(JSON.stringify("Error : " + error + "\n" + errLine));
    }


})


app.get("/gethex/:filename",(req,res)=>{
    console.log(req.params);
    const stream = require("node:fs").createReadStream(path.join(__dirname,"Repo",req.params.filename));
    stream.on("data",(byte)=>{
        res.send(byte);
    })
})


app.listen(9600, () => {
})
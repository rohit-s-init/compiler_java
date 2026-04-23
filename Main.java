import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
// ... (your other imports)
import java.util.List;

import ast.ASTBuilder;
import ast.ASTNode;
import parser.ParseNode;
import parser.Parser;
import tokenizer.Token;
import tokenizer.Tokenizer;

public class Main {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: lisa parse <file_path>");
            return;
        }

        try {
            String filePath = args[0];
            System.out.println("Parsing file: " + filePath);

            Path inputPath = Paths.get(filePath).toAbsolutePath();
            String inputFolder = inputPath.getParent().toString();
            String content = Files.readString(Paths.get(filePath));

            new parser.ParserTable();

            // Pass the file content to the tokenizer
            List<Token> token = Tokenizer.tokenize(content.replace(";", " "));

            // Parser.parse(token);
            new Parser();
            new ASTBuilder();

            ParseNode resp = Parser.parse(token);
            Parser.normalizeProgram(resp);

            // ASTNode n = ASTBuilder.build(resp);

            // n.forEach(new BiConsumer<String,Object>() {

            // @Override
            // public void accept(String t, Object u) {
            // System.out.println("opp : "+t);
            // System.out.println(u);
            // }

            // });

            // String json = Parser.toJson(resp);
            String json = Parser.toJson(resp);
            String originalFileName = inputPath.getFileName().toString();
            String outputFileName = originalFileName.replaceFirst("[.][^.]+$", "") + ".json";

            // 3. Create the final output path
            File outputFile = new File(inputFolder, outputFileName);

            FileWriter writer = new FileWriter(outputFile);
            writer.write(json);
            writer.close();

            Parser.printTree(resp, 0);

            System.out.println("successfull parse!");

        } catch (Exception e) {
            System.err.println("Error: Could not read file or process code.");
            e.printStackTrace();
        }
    }
}

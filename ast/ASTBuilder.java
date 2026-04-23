package ast;

import parser.ParseNode;
import java.util.*;

public class ASTBuilder {



    // ===== ENTRY POINT =====
    public static ASTNode build(ParseNode root) {
        return parseProgram(root);
    }

    // ===== PROGRAM =====
    private static ASTNode parseProgram(ParseNode node) {
        ASTNode program = new ASTNode("Program");

        for (ParseNode child : node.children) {
            if (child.symbol.equals("STATEMENT")) {
                program.children.add(parseStatement(child));
            } else if (child.symbol.equals("PROGRAM")) {
                program.children.addAll(parseProgram(child).children);
            }
        }

        return program;
    }

    // ===== STATEMENT =====
    public static ASTNode parseStatement(ParseNode node) {

        ParseNode first = node.children.get(0);

        switch (first.symbol) {

            case "DATA_TYPE":
                return parseDeclaration(node);

            case "IDENTIFIER":
                return parseIdentifierStatement(node);

            case "IF_STATEMENT":
                return parseIf(first);

            case "WHILE_LOOP":
                return parseWhile(first);

            case "RETURN_STMT":
                return parseReturn(first);

            case "BLOCK":
                return parseBlock(first);

            default:
                return new ASTNode("UNKNOWN");
        }
    }

    // ===== DECLARATION =====
    private static ASTNode parseDeclaration(ParseNode node) {
        String type = node.children.get(0).children.get(0).value;
        String name = node.children.get(1).children.get(0).value;

        ASTNode decl = new ASTNode("VarDecl");
        decl.children.add(new ASTNode("Type", type));
        decl.children.add(new ASTNode("Identifier", name));

        // if assignment exists
        if (node.children.get(1).children.size() > 1) {
            ParseNode exprNode = node.children.get(1).children.get(1).children.get(1);
            decl.children.add(parseExpression(exprNode));
        }

        return decl;
    }

    // ===== IDENTIFIER STATEMENT =====
    private static ASTNode parseIdentifierStatement(ParseNode node) {
        String name = node.children.get(0).value;
        ParseNode tail = node.children.get(1);

        if (tail.children.get(0).symbol.equals("=")) {
            ASTNode assign = new ASTNode("Assignment");
            assign.children.add(new ASTNode("Identifier", name));
            assign.children.add(parseExpression(tail.children.get(1)));
            return assign;
        }

        if (tail.children.get(0).symbol.equals("(")) {
            return parseFunctionCall(name, tail);
        }

        return new ASTNode("UNKNOWN");
    }

    // ===== FUNCTION CALL =====
    private static ASTNode parseFunctionCall(String name, ParseNode tail) {
        ASTNode call = new ASTNode("FunctionCall");
        call.children.add(new ASTNode("Identifier", name));

        if (tail.children.size() > 2) {
            ParseNode args = tail.children.get(1);
            call.children.addAll(parseArgs(args));
        }

        return call;
    }

    private static List<ASTNode> parseArgs(ParseNode node) {
        List<ASTNode> args = new ArrayList<>();

        if (node.symbol.equals("ARG_LIST")) {
            args.add(parseExpression(node.children.get(0)));

            if (node.children.size() > 1) {
                args.addAll(parseArgs(node.children.get(1)));
            }
        }

        return args;
    }

    // ===== IF =====
    private static ASTNode parseIf(ParseNode node) {
        ASTNode ifNode = new ASTNode("If");

        ifNode.children.add(parseExpression(node.children.get(2))); // condition
        ifNode.children.add(parseBlock(node.children.get(4))); // block

        return ifNode;
    }

    // ===== WHILE =====
    private static ASTNode parseWhile(ParseNode node) {
        ASTNode whileNode = new ASTNode("While");

        whileNode.children.add(parseExpression(node.children.get(2)));
        whileNode.children.add(parseBlock(node.children.get(4)));

        return whileNode;
    }

    // ===== RETURN =====
    private static ASTNode parseReturn(ParseNode node) {
        ASTNode ret = new ASTNode("Return");
        ret.children.add(parseExpression(node.children.get(1)));
        return ret;
    }

    // ===== BLOCK =====
    private static ASTNode parseBlock(ParseNode node) {
        ASTNode block = new ASTNode("Block");

        ParseNode stmtList = node.children.get(1);

        for (ParseNode child : stmtList.children) {
            if (child.symbol.equals("STATEMENT")) {
                block.children.add(parseStatement(child));
            }
        }

        return block;
    }

    // ===== EXPRESSION =====
    private static ASTNode parseExpression(ParseNode node) {
        return buildBinary(node);
    }

    private static ASTNode buildBinary(ParseNode node) {

        if (node.children.size() == 1) {
            return buildBinary(node.children.get(0));
        }

        if (node.symbol.equals("PRIMARY")) {
            ParseNode child = node.children.get(0);

            if (child.symbol.equals("NUMBER") || child.symbol.equals("STRING")) {
                return new ASTNode("Literal", child.value);
            }

            if (child.symbol.equals("IDENTIFIER")) {
                return new ASTNode("Identifier", child.value);
            }
        }

        if (node.children.size() == 3) {
            ASTNode left = buildBinary(node.children.get(0));
            String op = node.children.get(1).symbol;
            ASTNode right = buildBinary(node.children.get(2));

            ASTNode expr = new ASTNode("BinaryExpr", op);
            expr.children.add(left);
            expr.children.add(right);

            return expr;
        }

        for (ParseNode child : node.children) {
            ASTNode res = buildBinary(child);
            if (res != null) return res;
        }

        return null;
    }

    // ===== TO JSON =====
    public static String toJson(ASTNode node) {
        if (node == null) return "null";

        StringBuilder json = new StringBuilder();
        json.append("{");

        json.append("\"type\":\"").append(node.type).append("\"");

        if (node.value != null) {
            json.append(",\"value\":\"").append(node.value).append("\"");
        }

        json.append(",\"children\":[");

        for (int i = 0; i < node.children.size(); i++) {
            json.append(toJson(node.children.get(i)));
            if (i < node.children.size() - 1) json.append(",");
        }

        json.append("]}");

        return json.toString();
    }
}
package parser;

import java.lang.reflect.Array;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.Stack;
import java.util.stream.Collectors;

import tokenizer.Token;

public class Parser {

    private static ParserTable map = new ParserTable();

    public static Set<String> terminalSet = Set.of(
            "int", "short", "long", "char",
            "if", "else", "while", "return", "new",

            "IDENTIFIER", "NUMBER", "STRING", "CHARACTER",

            "=", "+", "-", "*", "/", "%",
            "==", "!=",
            ">", "<", ">=", "<=",
            "&&", "||",
            "<<", ">>",

            "(", ")", "{", "}", "[", "]", ",",

            "$");

    public static Set<String> nonTerminalSet = Set.of(
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
            "PRIMARY_TAIL");

    public static void printTree(ParseNode node, int level) {
        for (int i = 0; i < level; i++)
            System.out.print("  ");

        if (node.value != null)
            System.out.println(node.symbol + " : " + node.value);
        else
            System.out.println(node.symbol);

        for (ParseNode child : node.children) {
            printTree(child, level + 1);
        }
    }

    public static void normalizeProgram(ParseNode node) {

        if (node == null || node.children == null)
            return;

        List<ParseNode> newChildren = new LinkedList<>();

        for (ParseNode child : node.children) {

            // First normalize child recursively
            normalizeProgram(child);

            // 🔥 Flatten PROGRAM inside PROGRAM
            if (node.symbol.equals("PROGRAM") && child.symbol.equals("PROGRAM")) {

                // Instead of adding child, add its children
                newChildren.addAll(child.children);

            } else {
                newChildren.add(child);
            }
        }

        node.children = newChildren;
    }

    public static String toJson(ParseNode node) {

        if (node == null)
            return "null";

        StringBuilder json = new StringBuilder();

        json.append("{");

        // symbol
        json.append("\"symbol\": \"").append(node.symbol).append("\"");

        // value (if exists)
        if (node.value != null) {
            json.append(", \"value\": \"").append(node.value).append("\"");
        }

        // children
        json.append(", \"children\": [");

        for (int i = 0; i < node.children.size(); i++) {
            json.append(toJson(node.children.get(i)));

            if (i < node.children.size() - 1) {
                json.append(",");
            }
        }

        json.append("]");

        json.append("}");

        return json.toString();
    }

    public static ParseNode parse(List<Token> token) throws Exception {

        Stack<ParseNode> stack = new Stack<>();

        ParseNode root = new ParseNode("PROGRAM");

        stack.push(new ParseNode("$"));
        stack.push(root);

        token.add(new tokenizer.Token("$", "$"));

        int index = 0;

        while (!stack.isEmpty()) {

            Token current = token.get(index);
            ParseNode topNode = stack.peek();
            String top = topNode.symbol;

            // for terminals
            if (terminalSet.contains(top)) {

                if (current.getType().equals(top)) {

                    // OPTIONAL: store actual token value in leaf
                    topNode.value = current.getValue();

                    stack.pop();
                    index++;
                    continue;

                } else {
                    throw new Exception("Syntax error at token: " + current.getType());
                }

            }
            // for non terminals
            else {
                // System.out.println("passing top "+top+" two : "+current.getType());
                String opp = map.get(top, current.getType());

                System.out.print(
                        stack.stream()
                                .map(pNode -> pNode.symbol)
                                .collect(Collectors.joining(" ")));
                System.out.println("(input : " + current.getType() + ")");
                if (opp == null) {
                    throw new Exception("No rule for: " + top + " with token: " + current.getType()+"("+current.getValue()+")");
                }

                stack.pop();

                if (!opp.equals("ε")) {

                    String[] operations = opp.split(" ");

                    List<ParseNode> children = new LinkedList<>();

                    // create children
                    for (String sym : operations) {
                        ParseNode child = new ParseNode(sym);
                        children.add(child);
                    }

                    // attach to parent
                    for (ParseNode child : children) {
                        topNode.children.add(child);
                    }

                    // push in reverse
                    for (int i = children.size() - 1; i >= 0; i--) {
                        stack.push(children.get(i));
                    }
                }
            }
        }

        if (index == token.size()) {
            return root;
        } else {
            throw new Exception("Parsing failed: input not fully consumed");
        }
    }

}

package tokenizer;

import java.util.*;



public class Tokenizer {

    private static final Set<String> KEYWORDS = Set.of(
        "int", "short", "long", "char",
        "if", "else", "while", "return", "new"
    );

    private static final Set<String> OPERATORS = Set.of(
        "+", "-", "*", "/", "%",
        "==", "!=", ">", "<", ">=", "<=",
        "&&", "||", "<<", ">>", "="
    );

    private static final Set<Character> SYMBOLS = Set.of(
        '(', ')', '{', '}', '[', ']', ',', ';'
    );

    public static List<Token> tokenize(String input) {
        input = input.replace("let", "int");
        input = input.replace("byte", "int");

        List<Token> tokens = new ArrayList<>();

        int i = 0;

        while (i < input.length()) {
            char c = input.charAt(i);

            // Skip whitespace
            if (Character.isWhitespace(c)) {
                i++;
                continue;
            }

            // Identifier / Keyword
            if (Character.isLetter(c) || c == '_') {
                StringBuilder sb = new StringBuilder();

                while (i < input.length() &&
                       (Character.isLetterOrDigit(input.charAt(i)) || input.charAt(i) == '_')) {
                    sb.append(input.charAt(i));
                    i++;
                }

                String word = sb.toString();

                if (KEYWORDS.contains(word)) {
                    tokens.add(new Token(word, word));
                } else {
                    tokens.add(new Token("IDENTIFIER", word));
                }

                continue;
            }

            // Number
            if (Character.isDigit(c)) {
                StringBuilder sb = new StringBuilder();

                while (i < input.length() && Character.isDigit(input.charAt(i))) {
                    sb.append(input.charAt(i));
                    i++;
                }

                tokens.add(new Token("NUMBER", sb.toString()));
                continue;
            }

            // String
            if (c == '"') {
                i++;
                StringBuilder sb = new StringBuilder();

                while (i < input.length() && input.charAt(i) != '"') {
                    sb.append(input.charAt(i));
                    i++;
                }
                i++; 

                tokens.add(new Token("STRING", sb.toString()));
                continue;
            }

            
            if (c == '\'') {
                i++;
                char val = input.charAt(i);
                i += 2; 

                tokens.add(new Token("CHARACTER", String.valueOf(val)));
                continue;
            }

            
            if (i + 1 < input.length()) {
                String two = "" + c + input.charAt(i + 1);

                if (OPERATORS.contains(two)) {
                    tokens.add(new Token(two, two));
                    i += 2;
                    continue;
                }
            }

            
            if (OPERATORS.contains(String.valueOf(c))) {
                tokens.add(new Token(String.valueOf(c), String.valueOf(c)));
                i++;
                continue;
            }

            
            if (SYMBOLS.contains(c)) {
                if(c == ';'){
                    tokens.add(new Token("$", ";"));
                    i++;
                    continue;
                }
                tokens.add(new Token(String.valueOf(c), String.valueOf(c)));
                i++;
                continue;
            }

            
            throw new RuntimeException("Unknown character: " + c);
        }

        return tokens;
    }
}
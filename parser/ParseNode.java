package parser;

import java.util.LinkedList;
import java.util.List;

public class ParseNode {
    public String symbol;
    public String value;
    public List<ParseNode> children;

    public ParseNode(String symbol) {
        this.symbol = symbol;
        this.children = new LinkedList<>();
    }
}